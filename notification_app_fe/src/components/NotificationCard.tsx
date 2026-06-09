import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import { ReactNode } from "react";
import { Notification } from "../types";
import { relativeTime } from "../time";

// Visual configuration per notification type: icon plus a tinted colour used
// for the avatar background and the small type label.
const TYPE_CONFIG: Record<
  string,
  { icon: ReactNode; color: string; bg: string }
> = {
  Placement: {
    icon: <WorkRoundedIcon fontSize="small" />,
    color: "#16a34a",
    bg: "rgba(22, 163, 74, 0.12)",
  },
  Result: {
    icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
    color: "#5b5bd6",
    bg: "rgba(91, 91, 214, 0.12)",
  },
  Event: {
    icon: <EventRoundedIcon fontSize="small" />,
    color: "#0ea5e9",
    bg: "rgba(14, 165, 233, 0.12)",
  },
};

const FALLBACK = {
  icon: <NotificationsRoundedIcon fontSize="small" />,
  color: "#71717a",
  bg: "rgba(113, 113, 122, 0.12)",
};

interface Props {
  notification: Notification;
  isNew: boolean;
}

// A single notification row rendered as a premium card. New (unviewed) items
// carry an accent dot and a faint tint so they stand apart from seen items.
export default function NotificationCard({ notification, isNew }: Props) {
  const config = TYPE_CONFIG[notification.Type] ?? FALLBACK;

  return (
    <Card
      sx={{
        p: 2,
        display: "flex",
        gap: 2,
        alignItems: "flex-start",
        border: "1px solid",
        borderColor: isNew ? "rgba(91, 91, 214, 0.25)" : "divider",
        bgcolor: isNew ? "rgba(91, 91, 214, 0.03)" : "background.paper",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow:
            "0 4px 12px rgba(16, 24, 40, 0.06), 0 2px 4px rgba(16, 24, 40, 0.04)",
        },
      }}
    >
      <Avatar
        variant="rounded"
        sx={{ bgcolor: config.bg, color: config.color, borderRadius: 2.5 }}
      >
        {config.icon}
      </Avatar>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: config.color,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {notification.Type}
          </Typography>
          {isNew && (
            <Chip
              label="New"
              size="small"
              sx={{
                height: 18,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: "primary.main",
                color: "#fff",
              }}
            />
          )}
        </Stack>

        <Typography variant="body1" sx={{ fontWeight: 500, color: "text.primary" }}>
          {notification.Message}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {relativeTime(notification.Timestamp)}
        </Typography>
      </Box>

      {isNew && (
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "primary.main",
            mt: 1,
            flexShrink: 0,
          }}
        />
      )}
    </Card>
  );
}
