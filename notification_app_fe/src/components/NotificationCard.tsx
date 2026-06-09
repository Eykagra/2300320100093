import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Notification } from "../types";

// Maps a notification type to a Material UI chip colour for quick scanning.
const TYPE_COLOR: Record<
  string,
  "primary" | "secondary" | "default" | "success"
> = {
  Placement: "success",
  Result: "primary",
  Event: "secondary",
};

interface Props {
  notification: Notification;
  isNew: boolean;
}

// Displays a single notification. New (unviewed) items are visually emphasised
// with a highlighted left border and a "New" badge.
export default function NotificationCard({ notification, isNew }: Props) {
  const color = TYPE_COLOR[notification.Type] ?? "default";

  return (
    <Card
      variant="outlined"
      sx={{
        borderLeft: 6,
        borderLeftColor: isNew ? "warning.main" : "divider",
        bgcolor: isNew ? "action.hover" : "background.paper",
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
          flexWrap="wrap"
        >
          <Chip label={notification.Type} color={color} size="small" />
          {isNew && <Chip label="New" color="warning" size="small" />}
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {notification.Timestamp}
          </Typography>
        </Stack>
        <Typography variant="body1" sx={{ mt: 1 }}>
          {notification.Message}
        </Typography>
      </CardContent>
    </Card>
  );
}
