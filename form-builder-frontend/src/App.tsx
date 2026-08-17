import { Navigate, Route, Routes, useParams } from "react-router-dom";

import { AppLayout } from "./components/layout/AppLayout";
import { RouteFocusManager } from "./components/ui/RouteFocusManager";
import { FormBuilderPage } from "./pages/FormBuilderPage";
import { LandingPage } from "./pages/LandingPage";
import { PublicFormPage } from "./pages/PublicFormPage";
import { SubmissionsPage } from "./pages/SubmissionsPage";

const FormBuilderRoute = () => {
  const { id } = useParams<{ id: string }>();
  return <FormBuilderPage key={id || "new-form"} />;
};

const App = () => (
  <>
    <RouteFocusManager />
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/forms/new" element={<FormBuilderRoute />} />
        <Route path="/forms/:id/edit" element={<FormBuilderRoute />} />
        <Route path="/forms/:id/results" element={<SubmissionsPage />} />
      </Route>

      <Route path="/forms/:id" element={<PublicFormPage />} />
      <Route path="/404" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

export default App;
