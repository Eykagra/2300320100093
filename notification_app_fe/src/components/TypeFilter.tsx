import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

const TYPES = ["All", "Placement", "Result", "Event"];

interface Props {
  value: string;
  onChange: (value: string) => void;
}

// A row of selectable pills for filtering by notification type. The active
// pill is filled; the rest are outlined, giving a clean segmented control feel.
export default function TypeFilter({ value, onChange }: Props) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
      {TYPES.map((type) => {
        const active = value === type;
        return (
          <Chip
            key={type}
            label={type}
            onClick={() => onChange(type)}
            variant={active ? "filled" : "outlined"}
            color={active ? "primary" : "default"}
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              px: 0.5,
              ...(active ? {} : { borderColor: "divider" }),
            }}
          />
        );
      })}
    </Stack>
  );
}
