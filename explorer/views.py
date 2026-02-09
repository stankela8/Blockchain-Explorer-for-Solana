import re
from django.shortcuts import render, redirect
from django.http import JsonResponse, Http404
from .solana_rpc import rpc_call, SolanaRPCError

BASE58_RE = re.compile(r"^[1-9A-HJ-NP-Za-km-z]+$")
def home(request):
    try:
        current_slot = rpc_call("getSlot")
        epoch_info = rpc_call("getEpochInfo")
    except SolanaRPCError:
        raise Http404("RPC unavailable")

    # zadnjih 10 slotova (za prikaz)
    latest_slots = list(range(int(current_slot), int(current_slot) - 10, -1))

    # uzmi "recent transactions" iz najnovijeg slota koji ima block podatke
    recent_txs = []
    chosen_slot = None

    for s in latest_slots[:6]:  # probaj nekoliko slotova unazad
        try:
            block = rpc_call("getBlock", [int(s), {"maxSupportedTransactionVersion": 0}])
        except SolanaRPCError:
            continue
        if not block:
            continue

        txs = block.get("transactions") or []
        if not txs:
            continue

        for tx in txs[:10]:
            sigs = (tx.get("transaction") or {}).get("signatures") or []
            if not sigs:
                continue
            meta = tx.get("meta") or {}
            recent_txs.append({
                "signature": sigs[0],
                "success": meta.get("err") is None,
                "fee_lamports": meta.get("fee", 0),
            })

        chosen_slot = s
        break

    ctx = {
        "network": "Devnet",
        "current_slot": int(current_slot),
        "epoch": int(epoch_info.get("epoch", 0)),
        "slot_index": int(epoch_info.get("slotIndex", 0)),
        "slots_in_epoch": int(epoch_info.get("slotsInEpoch", 0)),
        "latest_slots": latest_slots,
        "recent_txs": recent_txs,
        "tx_source_slot": chosen_slot,
    }
    return render(request, "explorer/home.html", ctx)



def tx_detail(request, signature):
    tx = rpc_call(
        "getTransaction",
        [signature, {"encoding": "json", "maxSupportedTransactionVersion": 0}]
    )

    if tx is None:
        raise Http404("Transaction not found")

    meta = tx["meta"]
    message = tx["transaction"]["message"]

    data = {
        "signature": signature,
        "slot": tx["slot"],
        "block_time": tx["blockTime"],
        "success": meta["err"] is None,
        "fee_lamports": meta["fee"],
        "accounts": message["accountKeys"],
        "instructions_count": len(message["instructions"]),
    }

    return render(request, "explorer/tx_detail.html", {"tx": data})

def account_detail(request, address: str):
    try:
        bal = rpc_call("getBalance", [address])
        sigs = rpc_call("getSignaturesForAddress", [address, {"limit": 20}])
    except SolanaRPCError:
        raise Http404("Account not found")

    lamports = bal.get("value", 0)
    sol = lamports / 1_000_000_000

    # sigs is list of {signature, slot, err, blockTime...}
    txs = []
    for s in sigs or []:
        txs.append({
            "signature": s.get("signature"),
            "slot": s.get("slot"),
            "success": s.get("err") is None,
            "block_time": s.get("blockTime"),
        })

    ctx = {
        "address": address,
        "balance_lamports": lamports,
        "balance_sol": sol,
        "txs": txs,
    }
    return render(request, "explorer/account_detail.html", ctx)

def search(request):
    raw = (request.GET.get("q") or "").strip()

    if not raw:
        return render(request, "explorer/search_error.html", {
            "query": raw,
            "message": "Enter a transaction signature, wallet address, or slot number."
        }, status=400)

    # Allow slot numbers with separators: 439,928,208 / 439 928 208 / 439.928.208 / 439_928_208
    cleaned_digits = re.sub(r"[,\s._-]", "", raw)

    # Slot path: if after cleaning it's all digits
    if cleaned_digits.isdigit():
        # prevent absurdly long numbers
        if len(cleaned_digits) > 12:
            return render(request, "explorer/search_error.html", {
                "query": raw,
                "message": "Slot number is too large."
            }, status=400)

        return redirect(f"/slot/{int(cleaned_digits)}/")

    # Otherwise treat as base58 (address/signature)
    q = raw.strip()

    if not BASE58_RE.match(q):
        return render(request, "explorer/search_error.html", {
            "query": raw,
            "message": "Invalid format. Use a slot number, a Solana address, or a transaction signature."
        }, status=400)

    # Heuristic by length
    if len(q) >= 70:
        return redirect(f"/tx/{q}/")
    if len(q) < 32:
        return render(request, "explorer/search_error.html", {
            "query": raw,
            "message": "Input is too short to be a valid Solana address/signature."
        }, status=400)

    return redirect(f"/account/{q}/")
    
def slot_detail(request, slot: int):
    try:
        block = rpc_call(
            "getBlock",
            [int(slot), {"encoding": "json", "maxSupportedTransactionVersion": 0}]
        )
    except SolanaRPCError:
        raise Http404("Block not found")

    if block is None:
        raise Http404("Block not found")

    tx_sigs = []
    for tx in block.get("transactions", []):
        sigs = tx.get("transaction", {}).get("signatures", [])
        if sigs:
            tx_sigs.append(sigs[0])

    ctx = {
        "slot": int(slot),
        "block_time": block.get("blockTime"),
        "blockhash": block.get("blockhash"),
        "parent_slot": block.get("parentSlot"),
        "tx_count": len(tx_sigs),
        "tx_sigs": tx_sigs[:50],  # cap for UI
    }
    return render(request, "explorer/slot_detail.html", ctx)

def api_basic_stats(request):
    """
    JSON API endpoint za basic Solana statistics.
    Frontend ga može zvati za prikaz kartica / grafova.
    """
    try:
        from .solana_rpc import get_basic_stats
        data = get_basic_stats()
    except SolanaRPCError:
        return JsonResponse(
            {"error": "RPC unavailable"},
            status=503
        )

    return JsonResponse(data)
