import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { Chip } from "@mui/material";

export type FormStatus = "Draft" | "Live" | "Closed" | "Archived";

const statusConfig = {
  Draft: {
    icon: <EditNoteOutlinedIcon />,
    background: "#F2F4F7",
    color: "#475467",
  },
  Live: {
    icon: <CheckCircleOutlineIcon />,
    background: "#ECFDF3",
    color: "#067647",
  },
  Closed: {
    icon: <PauseCircleOutlineIcon />,
    background: "#FFF8E1",
    color: "#9A6700",
  },
  Archived: {
    icon: <Inventory2OutlinedIcon />,
    background: "#F2F4F7",
    color: "#667085",
  },
} satisfies Record<FormStatus, { icon: React.ReactElement; background: string; color: string }>;

export const StatusChip = ({ status }: { status: FormStatus }) => {
  const config = statusConfig[status];

  return (
    <Chip
      size="small"
      icon={config.icon}
      label={status}
      sx={{
        bgcolor: config.background,
        color: config.color,
        border: "1px solid",
        borderColor: `${config.color}26`,
        "& .MuiChip-icon": {
          color: "inherit",
          fontSize: 16,
        },
      }}
    />
  );
};

