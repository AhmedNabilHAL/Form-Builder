import "./App.css";

import { Routes, Route, Navigate } from "react-router-dom";
import { FormBuilderPage } from "./pages/FormBuilderPage";
import { PublicFormPage } from "./pages/PublicFormPage";
import { SubmissionsPage } from "./pages/SubmissionsPage";
import { LandingPage } from "./pages/LandingPage";
import { AppLayout } from "./components/layout/Applayout";

const App = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingPage />} />

        <Route path="/forms/new" element={<FormBuilderPage />} />

        <Route path="/forms/:id" element={<PublicFormPage />} />

        <Route path="/forms/:id/edit" element={<FormBuilderPage />} />

        <Route path="/forms/:id/results" element={<SubmissionsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;