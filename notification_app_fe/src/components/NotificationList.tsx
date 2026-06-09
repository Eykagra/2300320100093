import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Notification } from "../types";
import NotificationCard from "./NotificationCard";

interface Props {
  notifications: Notification[];
  viewedIds: Set<string>;
  loading: boolean;
  error: string | null;
}

// Renders the loading, error, empty, and populated states for a notification
// list, marking each item as new or already viewed.
export default function NotificationList({
  notifications,
  viewedIds,
  loading,
  error,
}: Props) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (notifications.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        No notifications to show.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {notifications.map((n) => (
        <NotificationCard
          key={n.ID}
          notification={n}
          isNew={!viewedIds.has(n.ID)}
        />
      ))}
    </Stack>
  );
}
