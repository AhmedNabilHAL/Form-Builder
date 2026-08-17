import { Chip } from "@mui/material";

export type FormStatus = "Draft" | "Live" | "Closed" | "Archived";

const statusConfig = {
  Draft: {
    background: "#F2F4F7",
    color: "#475467",
  },
  Live: {
    background: "#ECFDF3",
    color: "#067647",
  },
  Closed: {
    background: "#FFF8E1",
    color: "#9A6700",
  },
  Archived: {
    background: "#F2F4F7",
    color: "#667085",
  },
} satisfies Record<FormStatus, { background: string; color: string }>;

export const StatusChip = ({ status }: { status: FormStatus }) => {
  const config = statusConfig[status];

  return (
    <Chip
      size="small"
      label={status}
      sx={{
        bgcolor: config.background,
        color: config.color,
        border: "1px solid",
        borderColor: `${config.color}26`,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: "0.7rem",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    />
  );
};
