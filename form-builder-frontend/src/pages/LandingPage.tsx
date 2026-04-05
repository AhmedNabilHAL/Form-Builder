import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getFormsApi } from "../api/form";

export const LandingPage = () => {
  const navigate = useNavigate();

  const {
    data: forms = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["forms"],
    queryFn: getFormsApi,
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          px: { xs: 2, sm: 3, md: 4 },
          py: 5,
        }}
      >
        <Card
          sx={{
            mb: 4,
            overflow: "hidden",
            borderTop: "10px solid",
            borderTopColor: "primary.main",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h4" gutterBottom>
                  Form Builder
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Create forms, share public links, and review submissions from one place.
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => navigate("/forms/new")}
              >
                Create New Form
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total forms
              </Typography>
              <Typography variant="h5">{forms.length}</Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Quick access
              </Typography>
              <Typography variant="body1">
                Edit, open public form, or view results
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Your Forms</Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main" gutterBottom>
                Failed to load forms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {error instanceof Error ? error.message : "An unexpected error occurred."}
              </Typography>
            </CardContent>
          </Card>
        ) : forms.length === 0 ? (
          <Card>
            <CardContent sx={{ py: 6, textAlign: "center" }}>
              <DescriptionOutlinedIcon sx={{ fontSize: 42, color: "text.secondary", mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                No forms yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first form to start collecting responses.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate("/forms/new")}
              >
                Create New Form
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {forms.map((form) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={form.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 20px rgba(32,33,36,0.08)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: 10,
                      backgroundColor: "primary.main",
                    }}
                  />

                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      flexGrow: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {form.title || "Untitled form"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          minHeight: 42,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {form.description || "No description provided."}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip
                        size="small"
                        label={`${form.elements?.length ?? 0} field${(form.elements?.length ?? 0) === 1 ? "" : "s"
                          }`}
                      />
                    </Stack>

                    <Divider />

                    <Stack spacing={1.25}>
                      <Button
                        component={RouterLink}
                        to={`/forms/${form.id}`}
                        variant="outlined"
                        startIcon={<VisibilityOutlinedIcon />}
                        fullWidth
                      >
                        Open Public Form
                      </Button>

                      <Button
                        component={RouterLink}
                        to={`/forms/${form.id}/edit`}
                        variant="outlined"
                        startIcon={<EditOutlinedIcon />}
                        fullWidth
                      >
                        Edit Form
                      </Button>

                      <Button
                        component={RouterLink}
                        to={`/forms/${form.id}/results`}
                        variant="outlined"
                        startIcon={<BarChartOutlinedIcon />}
                        fullWidth
                      >
                        View Submissions
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default LandingPage;