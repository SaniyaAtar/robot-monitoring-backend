import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const BACKEND_URL = "http://127.0.0.1:8000"; // Ensure no trailing space

const App = () => {
  const [robots, setRobots] = useState([]);
  const [filter, setFilter] = useState("all");

  // Fetch initial robot data
  useEffect(() => {
    const fetchRobots = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/robots`);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const data = await response.json();
        setRobots(data);
      } catch (error) {
        console.error("Error fetching robots:", error);
        alert("Failed to fetch robot data. Please check if the backend is running.");
      }
    };
    fetchRobots();
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    let socket;

    const connectWebSocket = () => {
      socket = new WebSocket(`${BACKEND_URL.replace("http", "ws")}/updates`);

      socket.onmessage = (event) => {
        const updatedRobots = JSON.parse(event.data);
        setRobots(updatedRobots);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        alert("WebSocket connection failed. Retrying in 5 seconds...");
        setTimeout(connectWebSocket, 5000); // Retry WebSocket connection
      };

      socket.onclose = () => {
        console.log("WebSocket closed. Reconnecting in 5 seconds...");
        setTimeout(connectWebSocket, 5000); // Retry WebSocket connection
      };
    };

    connectWebSocket();

    return () => {
      if (socket) socket.close(); // Cleanup WebSocket on unmount
    };
  }, []);

  // Apply filters
  const filteredRobots = robots.filter((robot) => {
    if (filter === "all") return true;
    if (filter === "online") return robot.status === "Online";
    if (filter === "offline") return robot.status === "Offline";
    if (filter === "low-battery") return robot.battery < 20;
    return true;
  });

  return (
    <div>
      <h1>Robot Monitoring Dashboard</h1>

      {/* Filters */}
      <div>
        <button onClick={() => setFilter("all")}>All Robots</button>
        <button onClick={() => setFilter("online")}>Online</button>
        <button onClick={() => setFilter("offline")}>Offline</button>
        <button onClick={() => setFilter("low-battery")}>Low Battery</button>
      </div>

      {/* Map View */}
      <MapContainer center={[0, 0]} zoom={2} style={{ height: "400px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {filteredRobots.map((robot) => {
          if (
            Array.isArray(robot.location) &&
            robot.location.length === 2 &&
            typeof robot.location[0] === "number" &&
            typeof robot.location[1] === "number"
          ) {
            return (
              <Marker key={robot.id} position={robot.location}>
                <Popup>
                  <strong>{robot.id}</strong>
                  <br />
                  Status: {robot.status}
                  <br />
                  Battery: {robot.battery}%
                </Popup>
              </Marker>
            );
          }
          return null; // Skip invalid location data
        })}
      </MapContainer>

      {/* Table View */}
      <table>
        <thead>
          <tr>
            <th>Robot ID</th>
            <th>Status</th>
            <th>Battery (%)</th>
            <th>CPU Usage (%)</th>
            <th>RAM Consumption (MB)</th>
            <th>Last Updated</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {filteredRobots.map((robot) => (
            <tr key={robot.id}>
              <td>{robot.id}</td>
              <td>{robot.status}</td>
              <td>{robot.battery}%</td>
              <td>{robot.cpu}%</td>
              <td>{robot.ram}</td>
              <td>{new Date(robot.last_updated).toLocaleString()}</td>
              <td>
                {robot.location[0].toFixed(2)}, {robot.location[1].toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;