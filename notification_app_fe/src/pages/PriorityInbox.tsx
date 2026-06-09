import { useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
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
// result > event, then recency), with a type filter and a selectable count.
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
      } catch {
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
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(245, 158, 11, 0.14)",
              color: "warning.main",
            }}
          >
            <BoltRoundedIcon />
          </Box>
          <Box>
            <Typography variant="h4">Priority Inbox</Typography>
            <Typography variant="body2" color="text.secondary">
              The most important notifications first, ranked by type and recency.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
      >
        <TypeFilter value={filter} onChange={setFilter} />
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip
            label={`${notifications.length} shown`}
            size="small"
            variant="outlined"
            sx={{ borderColor: "divider", fontWeight: 600 }}
          />
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
