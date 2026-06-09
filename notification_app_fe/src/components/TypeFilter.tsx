import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

const TYPES = ["All", "Placement", "Result", "Event"];

interface Props {
  value: string;
  onChange: (value: string) => void;
}

// A responsive row of toggle buttons for filtering notifications by type.
export default function TypeFilter({ value, onChange }: Props) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      size="small"
      color="primary"
      onChange={(_, next) => {
        if (next !== null) {
          onChange(next);
        }
      }}
      sx={{ flexWrap: "wrap" }}
    >
      {TYPES.map((type) => (
        <ToggleButton key={type} value={type}>
          {type}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
