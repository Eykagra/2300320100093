import { useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { Notification } from "../types";
import { fetchNotifications } from "../api";
import { Log } from "../logger";
import { getViewedIds } from "../viewed";
import { topN } from "../priority";
import NotificationList from "../components/NotificationList";
import TypeFilter from "../components/TypeFilter";

// Choices for how many top notifications to display.
const LIMIT_OPTIONS = [10, 15, 20];

// Page that displays the top "n" notifications by priority (placement >
// result > event, then recency), with a type filter and selectable count.
export default function PriorityInbox() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [viewedIds] = useState<Set<string>>(getViewedIds());
  const [filter, setFilter] = useState("All");
  const [limit, setLimit] = useState(10);
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
        setNotifications(topN(data, limit));

        await Log(
          "frontend",
          "info",
          "page",
          `priority inbox showing top ${limit}`
        );
      } catch (err) {
        if (active) {
          setError("Could not load priority notifications. Please try again.");
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
  }, [filter, limit]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" gutterBottom>
          Priority Inbox
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The most important unread notifications first, ranked by type and recency.
        </Typography>
      </Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
      >
        <TypeFilter value={filter} onChange={setFilter} />
        <Box sx={{ flexGrow: 1 }} />
        <TextField
          select
          size="small"
          label="Show top"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          sx={{ minWidth: 120 }}
        >
          {LIMIT_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              Top {option}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <NotificationList
        notifications={notifications}
        viewedIds={viewedIds}
        loading={loading}
        error={error}
      />
    </Stack>
  );
}
