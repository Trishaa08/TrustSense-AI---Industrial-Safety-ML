from fastapi import APIRouter, HTTPException, Query
from app.services.simulation import simulation_service

router = APIRouter(prefix="/simulation", tags=["Simulation Playback"])

@router.get("/info")
def get_simulation_info():
    """Returns simulation duration, step counts, and frequency metadata."""
    return simulation_service.get_simulation_info()

@router.get("/step/{step_index}")
def get_simulation_step(step_index: int):
    """Returns synchronized sensor readings and spatial localization for a specific timestep index."""
    res = simulation_service.get_step(step_index)
    if "error" in res:
        raise HTTPException(status_code=500, detail=res["error"])
    return res
