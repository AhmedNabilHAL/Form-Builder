import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import {
  Box,
  Button,
  Card,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { Form } from "../../types/Form";
import type { FormElement } from "../../types/FormInput";
import { inputTypeLabel } from "../../utils/form";
import { FormElementPreview } from "./FormBuilderPreview";
import { FormElementEditor } from "./FormElementEditor";

interface FormElementBuilderProps {
  index: number;
  isActive: boolean;
  isEditing: boolean;
  issues?: string[];
  cardRef?: (node: HTMLDivElement | null) => void;
  onActivate: () => void;
  onEdit: () => void;
  onFinishEditing: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const FormElementBuilder = ({
  index,
  isActive,
  isEditing,
  issues = [],
  cardRef,
  onActivate,
  onEdit,
  onFinishEditing,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onDelete,
  canMoveUp,
  canMoveDown,
}: FormElementBuilderProps) => {
  const { control, getValues, setValue } = useFormContext<Form>();
  const element = useWatch({ control, name: `elements.${index}` });
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const editBaselineRef = useRef<FormElement | null>(null);
  const invalid = issues.length > 0;

  useEffect(() => {
    if (!isEditing) {
      editBaselineRef.current = null;
      return;
    }

    editBaselineRef.current = structuredClone(
      getValues(`elements.${index}`)
    );
  }, [getValues, index, isEditing]);

  if (!element) return null;

  const cancelEditing = () => {
    if (editBaselineRef.current) {
      setValue(
        `elements.${index}`,
        structuredClone(editBaselineRef.current),
        { shouldDirty: true, shouldTouch: true }
      );
    }
    editBaselineRef.current = null;
    onFinishEditing();
  };

  const finishEditing = () => {
    editBaselineRef.current = null;
    onFinishEditing();
  };

  return (
    <Box
      ref={cardRef}
      data-question-id={element.id}
      onClick={onActivate}
      onFocusCapture={onActivate}
      sx={{
        position: "relative",
        minWidth: 0,
        ml: { xs: 0, sm: "42px" },
        mb: 2,
        scrollMarginTop: { xs: 96, md: 152 },
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          zIndex: 2,
          insetInlineStart: -42,
          insetBlockStart: 17,
          width: 30,
          height: 26,
          display: { xs: "none", sm: "grid" },
          placeItems: "center",
          borderRadius: "7px",
          border: "1px solid",
          borderColor: invalid
            ? "error.main"
            : isActive
              ? "primary.main"
              : "#B7B2CF",
          bgcolor: invalid
            ? "error.main"
            : isActive
              ? "primary.main"
              : "background.paper",
          color: invalid || isActive ? "common.white" : "text.secondary",
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: "0.58rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
          boxShadow: isActive
            ? "0 3px 10px rgba(91, 80, 247, 0.20)"
            : "none",
          transition:
            "background-color 150ms ease, border-color 150ms ease, color 150ms ease, box-shadow 150ms ease",
        }}
      >
        {invalid ? (
          <ReportProblemOutlinedIcon sx={{ fontSize: 15 }} />
        ) : (
          String(index + 1).padStart(2, "0")
        )}
      </Box>

      <Card
        sx={{
          position: "relative",
          minWidth: 0,
          overflow: "visible",
          borderRadius: "13px",
          borderWidth: isEditing ? 2 : 1.5,
          borderColor: invalid
            ? "error.main"
            : isActive
              ? "primary.main"
              : "divider",
          bgcolor: invalid ? "error.light" : "background.paper",
          boxShadow: isEditing
            ? "0 10px 28px rgba(91, 80, 247, 0.16)"
            : isActive
              ? "0 5px 20px rgba(91, 80, 247, 0.10)"
              : "0 2px 12px rgba(91, 80, 247, 0.05)",
          outline:
            isActive || isEditing
              ? "3px solid rgba(91, 80, 247, 0.10)"
              : "none",
          transform: isEditing ? "translateY(-1px)" : "none",
          transition:
            "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
        }}
      >
        <Box
          sx={{
            minWidth: 0,
            px: { xs: 2, sm: 2.5 },
            py: { xs: 2, sm: 1.75 },
          }}
        >
          <Stack spacing={isEditing ? 1.5 : 1.25}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: 20,
                      px: 0.9,
                      border: "1px solid",
                      borderColor: invalid ? "error.main" : "divider",
                      borderRadius: "5px",
                      bgcolor: "#FBFAFF",
                      color: invalid ? "error.main" : "primary.main",
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: "0.54rem",
                      lineHeight: 1,
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {inputTypeLabel(element.type)}
                  </Box>
                  <Typography
                    component="span"
                    sx={{
                      color: "text.secondary",
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: "0.54rem",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    · {element.required ? "Required" : "Optional"}
                  </Typography>
                </Stack>
                {!isEditing && (
                  <Typography
                    component="h3"
                    sx={{
                      maxWidth: "40ch",
                      mt: 1.1,
                      overflowWrap: "anywhere",
                      color: "text.primary",
                      fontSize: { xs: "0.92rem", sm: "0.98rem" },
                      lineHeight: 1.4,
                      fontWeight: 680,
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {element.title.trim() || "Untitled question"}
                  </Typography>
                )}
              </Box>
              <IconButton
                aria-label={`Question ${index + 1} actions`}
                onClick={(event) => setAnchorEl(event.currentTarget)}
                sx={{
                  width: 32,
                  height: 32,
                  mt: -0.5,
                  mr: -0.5,
                  color: "primary.main",
                }}
              >
                <MoreHorizIcon fontSize="small" />
              </IconButton>
            </Stack>

          {isEditing ? (
            <>
              <FormElementEditor index={index} issues={issues} />
              <Divider />
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <Button
                  type="button"
                  variant="contained"
                  onClick={finishEditing}
                  sx={{ minHeight: 34, px: 1.75, fontSize: "0.75rem" }}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={cancelEditing}
                  sx={{ minHeight: 34, px: 1.75, fontSize: "0.75rem" }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="text"
                  color="error"
                  onClick={onDelete}
                  sx={{
                    ml: "auto",
                    minHeight: 34,
                    px: 0.5,
                    fontSize: "0.75rem",
                  }}
                >
                  Delete
                </Button>
              </Stack>
            </>
          ) : (
            <>
              <Box
                sx={{
                  maxWidth: 520,
                  "& .MuiOutlinedInput-root": {
                    minHeight: 40,
                    bgcolor: "#FBFAFF",
                    fontSize: "0.8125rem",
                  },
                  "& .MuiInputBase-input": {
                    py: 0.9,
                  },
                }}
              >
                <FormElementPreview index={index} control={control} />
              </Box>

              {invalid && (
                <Typography
                  color="error.main"
                  role="status"
                  sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                >
                  {issues[0]}
                </Typography>
              )}

              <Box>
                <Button
                  type="button"
                  variant="text"
                  onClick={onEdit}
                  sx={{
                    minWidth: 0,
                    minHeight: 28,
                    px: 0,
                    py: 0.25,
                    justifyContent: "flex-start",
                    color: "primary.main",
                    fontSize: "0.76rem",
                    "&:hover": {
                      bgcolor: "transparent",
                      textDecoration: "underline",
                    },
                  }}
                >
                  Edit question
                </Button>
              </Box>
            </>
          )}
          </Stack>
        </Box>
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
          Move up
        </MenuItem>
        <MenuItem
          disabled={!canMoveDown}
          onClick={() => {
            onMoveDown();
            setAnchorEl(null);
          }}
        >
          Move down
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDuplicate();
            setAnchorEl(null);
          }}
        >
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
          Delete question
        </MenuItem>
      </Menu>
    </Box>
  );
};
