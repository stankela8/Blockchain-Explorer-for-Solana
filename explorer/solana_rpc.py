import os
import requests

SOLANA_RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.devnet.solana.com")

class SolanaRPCError(Exception):
    pass

def rpc_call(method: str, params=None, timeout: int = 15):
    if params is None:
        params = []
    payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
    r = requests.post(SOLANA_RPC_URL, json=payload, timeout=timeout)
    r.raise_for_status()
    data = r.json()
    if "error" in data:
        raise SolanaRPCError(data["error"])
    return data["result"]

def get_basic_stats():
    """
    Returns basic Solana network statistics for the current devnet cluster.
    Values are converted to SOL where ima smisla.
    """
    # Supply (lamports) -> SOL
    supply = rpc_call("getSupply")
    value = supply.get("value", {})

    total_lamports = value.get("total", 0)
    circulating_lamports = value.get("circulating", 0)
    non_circulating_lamports = value.get("nonCirculating", 0)

    lamports_per_sol = 1_000_000_000
    total_sol = total_lamports / lamports_per_sol
    circulating_sol = circulating_lamports / lamports_per_sol
    non_circulating_sol = non_circulating_lamports / lamports_per_sol

    # Performance samples – uzmi više uzoraka za povijesni TPS.
    samples = rpc_call("getRecentPerformanceSamples", [10])  # zadnjih 10 uzoraka

    tps_series = []
    if samples:
        for s in samples:
            num_tx = s.get("numTransactions", 0)
            secs = s.get("samplePeriodSecs", 1) or 1
            tps_value = num_tx / secs
            tps_series.append({
                "slot": s.get("slot", 0),
                "tps": tps_value,
            })

        # trenutni TPS 
        tps = tps_series[0]["tps"]
    else:
        tps = None
        tps_series = []

    current_slot = rpc_call("getSlot")
    epoch_info = rpc_call("getEpochInfo")

    return {
        "tps": tps,
        "tps_series": tps_series,  
        "total_supply_sol": total_sol,
        "circulating_supply_sol": circulating_sol,
        "non_circulating_supply_sol": non_circulating_sol,
        "current_slot": int(current_slot),
        "epoch": int(epoch_info.get("epoch", 0)),
        "slots_in_epoch": int(epoch_info.get("slotsInEpoch", 0)),
    }

