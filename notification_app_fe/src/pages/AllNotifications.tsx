import { useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Notification } from "../types";
import { fetchNotifications } from "../api";
import { Log } from "../logger";
import { getViewedIds, markViewed } from "../viewed";
import NotificationList from "../components/NotificationList";
import TypeFilter from "../components/TypeFilter";

// Page that displays all notifications with a type filter. New items are
// highlighted until viewed; opening the page marks the shown items as viewed.
export default function AllNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [viewedIds, setViewedIds] = useState<Set<string>>(getViewedIds());
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const type = filter === "All" ? undefined : filter;
        const data = await fetchNotifications({ notificationType: type });
        if (!active) {
          return;
        }
        setNotifications(data);

        // Capture which IDs were new before this view, then mark them viewed.
        setViewedIds(getViewedIds());
        markViewed(data.map((n) => n.ID));

        await Log(
          "frontend",
          "info",
          "page",
          `all notifications page loaded ${data.length} items`
        );
      } catch (err) {
        if (active) {
          setError("Could not load notifications. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [filter]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" gutterBottom>
          All Notifications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Every notification, newest highlighted until you have seen it.
        </Typography>
      </Box>
      <TypeFilter value={filter} onChange={setFilter} />
      <NotificationList
        notifications={notifications}
        viewedIds={viewedIds}
        loading={loading}
        error={error}
      />
    </Stack>
  );
}
