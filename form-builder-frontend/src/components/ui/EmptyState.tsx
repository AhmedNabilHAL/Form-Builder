import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  compact?: boolean;
}

export const EmptyState = ({
  icon,
  title,
  description,
  actions,
  compact = false,
}: EmptyStateProps) => (
  <Stack
    alignItems="center"
    textAlign="center"
    spacing={compact ? 1 : 1.5}
    sx={{
      py: compact ? 4 : { xs: 6, md: 8 },
      px: 2,
      maxWidth: 560,
      mx: "auto",
    }}
  >
    <Box
      sx={{
        width: compact ? 44 : 56,
        height: compact ? 44 : 56,
        borderRadius: "14px",
        bgcolor: "primary.light",
        color: "primary.main",
        display: "grid",
        placeItems: "center",
        "& svg": {
          fontSize: compact ? 24 : 30,
        },
      }}
    >
      {icon}
    </Box>
    <Typography component="h2" variant="h3">
      {title}
    </Typography>
    <Typography color="text.secondary" sx={{ maxWidth: "50ch" }}>
      {description}
    </Typography>
    {actions && <Box sx={{ pt: 1 }}>{actions}</Box>}
  </Stack>
);

