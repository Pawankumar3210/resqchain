from fastapi import APIRouter
import heapq

router = APIRouter()

# This is our city map represented as a graph
# Each node is a location, each edge has a (travel_time, risk_level) weight
city_graph = {
    "Warehouse": [("Zone_A", 4, 1), ("Zone_B", 2, 3)],
    "Zone_A": [("Warehouse", 4, 1), ("Zone_C", 5, 2), ("Hospital", 10, 1)],
    "Zone_B": [("Warehouse", 2, 3), ("Zone_C", 1, 4), ("Zone_D", 6, 2)],
    "Zone_C": [("Zone_A", 5, 2), ("Zone_B", 1, 4), ("Hospital", 3, 1)],
    "Zone_D": [("Zone_B", 6, 2), ("Market", 2, 1)],
    "Hospital": [("Zone_A", 10, 1), ("Zone_C", 3, 1)],
    "Market": [("Zone_D", 2, 1)]
}

# Dijkstra Algorithm — finds the safest + fastest path
def dijkstra(graph, start, end):
    # priority queue: (cost, current_node, path)
    queue = [(0, start, [start])]
    visited = set()

    while queue:
        (cost, node, path) = heapq.heappop(queue)

        if node in visited:
            continue
        visited.add(node)

        if node == end:
            return {"path": path, "total_cost": cost}

        for neighbor, travel_time, risk in graph.get(node, []):
            if neighbor not in visited:
                # Combined cost = travel time + risk level
                new_cost = cost + travel_time + risk
                heapq.heappush(queue, (new_cost, neighbor, path + [neighbor]))

    return {"path": [], "total_cost": -1}  # No path found

@router.get("/find")
def find_route(start: str, end: str):
    if start not in city_graph:
        return {"error": f"'{start}' is not a valid location"}
    if end not in city_graph:
        return {"error": f"'{end}' is not a valid location"}

    result = dijkstra(city_graph, start, end)

    if result["total_cost"] == -1:
        return {"message": "No route found!"}

    return {
        "start": start,
        "end": end,
        "optimal_path": result["path"],
        "total_cost": result["total_cost"],
        "message": "✅ Safest route found!"
    }

@router.get("/locations")
def get_locations():
    return {"available_locations": list(city_graph.keys())}