import React from "react";
import TimelineScene from "./components/TimelineScene";

function App() {
  return (
    <div className="app">
      <header className="timeline-header">
        <h1>Our History</h1>
        <p>Scroll horizontally through time</p>
      </header>

      <TimelineScene />
    </div>
  );
}

export default App;
