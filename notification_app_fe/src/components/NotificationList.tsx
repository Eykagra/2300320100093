import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import { Notification } from "../types";
import NotificationCard from "./NotificationCard";

interface Props {
  notifications: Notification[];
  viewedIds: Set<string>;
  loading: boolean;
  error: string | null;
}

// A single loading placeholder shaped like a notification card.
function LoadingRow() {
  return (
    <Card sx={{ p: 2, display: "flex", gap: 2, border: "1px solid", borderColor: "divider" }}>
      <Skeleton variant="rounded" width={40} height={40} />
      <Box sx={{ flexGrow: 1 }}>
        <Skeleton width="30%" height={16} />
        <Skeleton width="80%" height={22} />
        <Skeleton width="20%" height={14} />
      </Box>
    </Card>
  );
}

// Renders loading, error, empty, and populated states for a notification list,
// marking each item as new or already viewed.
export default function NotificationList({
  notifications,
  viewedIds,
  loading,
  error,
}: Props) {
  if (loading) {
    return (
      <Stack spacing={1.5}>
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingRow key={i} />
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 3 }}>
        {error}
      </Alert>
    );
  }

  if (notifications.length === 0) {
    return (
      <Box
        sx={{
          py: 8,
          textAlign: "center",
          color: "text.secondary",
        }}
      >
        <InboxRoundedIcon sx={{ fontSize: 48, opacity: 0.4 }} />
        <Typography sx={{ mt: 1 }}>No notifications to show.</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
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
