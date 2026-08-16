import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { Form } from "../../types/Form";
import { inputTypeLabel } from "../../utils/form";
import { FormElementPreview } from "./FormBuilderPreview";

interface FormElementBuilderProps {
  index: number;
  isActive: boolean;
  issues?: string[];
  onEdit: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isLast: boolean;
}

export const FormElementBuilder = ({
  index,
  isActive,
  issues = [],
  onEdit,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown,
  isLast,
}: FormElementBuilderProps) => {
  const { control } = useFormContext<Form>();
  const element = useWatch({ control, name: `elements.${index}` });
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const invalid = issues.length > 0;

  if (!element) return null;

  return (
    <Box
      sx={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "28px minmax(0, 1fr)",
        columnGap: 2,
        pb: isLast ? 0 : 2.5,
        "&::before": isLast
          ? undefined
          : {
              content: '""',
              position: "absolute",
              insetInlineStart: 13,
              insetBlockStart: 28,
              insetBlockEnd: 0,
              width: 2,
              bgcolor: "divider",
            },
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: "relative",
          zIndex: 1,
          width: 28,
          height: 28,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          border: "2px solid",
          borderColor: invalid
            ? "error.main"
            : isActive
              ? "primary.main"
              : "primary.main",
          bgcolor: isActive ? "primary.main" : "background.paper",
          color: invalid
            ? "error.main"
            : isActive
              ? "primary.contrastText"
              : "primary.main",
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: "0.75rem",
          fontWeight: 500,
        }}
      >
        {invalid ? <ReportProblemOutlinedIcon sx={{ fontSize: 16 }} /> : index + 1}
      </Box>

      <Card
        sx={{
          minWidth: 0,
          borderWidth: isActive || invalid ? 2 : 1,
          borderColor: invalid
            ? "error.main"
            : isActive
              ? "primary.main"
              : "divider",
          boxShadow: isActive ? "0 1px 2px rgba(23, 32, 51, 0.08)" : "none",
          overflow: "hidden",
        }}
      >
        <Stack spacing={2} sx={{ p: { xs: 2, md: 2.5 } }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontFamily: '"IBM Plex Mono", monospace',
                  letterSpacing: "0.08em",
                  color: invalid ? "error.main" : "text.secondary",
                  mb: 0.5,
                }}
              >
                QUESTION {String(index + 1).padStart(2, "0")}
              </Typography>
              <Typography component="h2" variant="h4" sx={{ overflowWrap: "anywhere" }}>
                {element.title.trim() || "Untitled question"}
              </Typography>
            </Box>
            <IconButton
              aria-label={`Question ${index + 1} actions`}
              onClick={(event) => setAnchorEl(event.currentTarget)}
            >
              <MoreHorizIcon />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={inputTypeLabel(element.type)} />
            {element.required && (
              <Chip
                size="small"
                label="Required"
                sx={{ bgcolor: "error.light", color: "error.main" }}
              />
            )}
            {invalid && (
              <Chip
                size="small"
                icon={<ReportProblemOutlinedIcon />}
                label="Needs attention"
                sx={{
                  bgcolor: "error.light",
                  color: "error.main",
                  "& .MuiChip-icon": { color: "inherit" },
                }}
              />
            )}
          </Stack>

          <Divider />
          <FormElementPreview index={index} control={control} />

          {invalid && (
            <Typography variant="body2" color="error.main" role="status">
              {issues[0]}
            </Typography>
          )}

          <Box>
            <Button
              type="button"
              variant={isActive ? "contained" : "outlined"}
              startIcon={<EditOutlinedIcon />}
              onClick={onEdit}
            >
              Edit question
            </Button>
          </Box>
        </Stack>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { minWidth: 200 } } }}
      >
        <MenuItem
          disabled={!canMoveUp}
          onClick={() => {
            onMoveUp();
            setAnchorEl(null);
          }}
        >
          <KeyboardArrowUpIcon fontSize="small" sx={{ mr: 1.5 }} />
          Move up
        </MenuItem>
        <MenuItem
          disabled={!canMoveDown}
          onClick={() => {
            onMoveDown();
            setAnchorEl(null);
          }}
        >
          <KeyboardArrowDownIcon fontSize="small" sx={{ mr: 1.5 }} />
          Move down
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDuplicate();
            setAnchorEl(null);
          }}
        >
          <ContentCopyOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />
          Duplicate
        </MenuItem>
        <Divider />
        <MenuItem
          sx={{ color: "error.main" }}
          onClick={() => {
            onDelete();
            setAnchorEl(null);
          }}
        >
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1.5 }} />
          Delete question
        </MenuItem>
      </Menu>
    </Box>
  );
};
