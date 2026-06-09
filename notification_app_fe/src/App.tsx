import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import AllNotifications from "./pages/AllNotifications";
import PriorityInbox from "./pages/PriorityInbox";

// Root component wiring the two pages into the responsive layout.
export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<AllNotifications />} />
        <Route path="/priority" element={<PriorityInbox />} />
      </Routes>
    </Layout>
  );
}
