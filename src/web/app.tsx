import { Route, Switch, Redirect, useLocation } from "wouter";
import { Provider } from "./components/provider";
import { ErrorBoundary } from "./components/error-boundary";
import { AuthProvider, useAuth, getPostLoginPath, hasActiveSystemAccess, isAllowedWithoutSystemAccess } from "./contexts/auth-context";
import { NotificationsProvider } from "./contexts/notifications-context";
import { ClinicalLayoutProvider } from "./contexts/clinical-layout-context";
import { WorkspaceWatermarkProvider } from "./contexts/workspace-watermark-context";
import { DashboardLogoProvider } from "./contexts/dashboard-logo-context";
import Login from "./pages/login";
import Register from "./pages/register";
import VerifyEmail from "./pages/verify-email";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";
import ChangePassword from "./pages/change-password";
import Terms from "./pages/terms";
import Privacy from "./pages/privacy";
import GoogleCallbackPage from "./pages/google-callback";
import Dashboard from "./pages/dashboard";
import LandingPage from "./pages/landing-page";

const ProtectedRoute = ({ component: Component, path }: { component: React.ComponentType; path?: string }) => {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-brand-ink" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  // Si tiene contraseña temporal, obligar a cambiarla antes de acceder al resto
  const currentPath = path ?? location;
  if (user.mustChangePassword && currentPath !== "/change-password") {
    return <Redirect to="/change-password" />;
  }

  if (user && !hasActiveSystemAccess(user) && !isAllowedWithoutSystemAccess(currentPath)) {
    return <Redirect to={getPostLoginPath(user)} />;
  }

  return <Component />;
};

const PublicRoute = ({ component: Component }: { component: React.ComponentType }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-brand-ink" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (user) {
    return <Redirect to={getPostLoginPath(user)} />;
  }

  return <Component />;
};

/** `/` pública para visitantes; dashboard para usuarios autenticados. */
const HomeRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-brand-ink" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (user) {
    return <ProtectedRoute component={Dashboard} path="/" />;
  }

  return <LandingPage />;
};

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login">
        <PublicRoute component={Login} />
      </Route>
      <Route path="/register">
        <PublicRoute component={Register} />
      </Route>
      <Route path="/verify-email">
        <PublicRoute component={VerifyEmail} />
      </Route>
      <Route path="/forgot-password">
        <PublicRoute component={ForgotPassword} />
      </Route>
      <Route path="/reset-password">
        <PublicRoute component={ResetPassword} />
      </Route>
      <Route path="/terms">
        <PublicRoute component={Terms} />
      </Route>
      <Route path="/privacy">
        <PublicRoute component={Privacy} />
      </Route>
      <Route path="/auth/google/callback">
        <PublicRoute component={GoogleCallbackPage} />
      </Route>
      <Route path="/change-password">
        <ProtectedRoute component={ChangePassword} path="/change-password" />
      </Route>
      {/* Landing siempre accesible (también con sesión), p. ej. desde el logo del sidebar */}
      <Route path="/landing" component={LandingPage} />
      <Route path="/">
        <HomeRoute />
      </Route>
      <Route path="/:rest*">
        <ProtectedRoute component={Dashboard} />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <Provider>
      <AuthProvider>
        <NotificationsProvider>
          <ClinicalLayoutProvider>
            <WorkspaceWatermarkProvider>
              <DashboardLogoProvider>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
              </DashboardLogoProvider>
            </WorkspaceWatermarkProvider>
          </ClinicalLayoutProvider>
        </NotificationsProvider>
      </AuthProvider>
    </Provider>
  );
}

export default App;
