import { Route, Switch, Redirect, useLocation } from "wouter";
import { Provider } from "./components/provider";
import { ErrorBoundary } from "./components/error-boundary";
import { AuthProvider, useAuth } from "./contexts/auth-context";
import { LanguageProvider } from "./contexts/language-context";
import Login from "./pages/login";
import VerifyEmail from "./pages/verify-email";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";
import ChangePassword from "./pages/change-password";
import Terms from "./pages/terms";
import Dashboard from "./pages/dashboard";

const ProtectedRoute = ({ component: Component, path }: { component: React.ComponentType; path?: string }) => {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[#1a1a1a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

  return <Component />;
};

const PublicRoute = ({ component: Component }: { component: React.ComponentType }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-[#1a1a1a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (user) {
    return <Redirect to={user.mustChangePassword ? "/change-password" : "/"} />;
  }

  return <Component />;
};

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login">
        <PublicRoute component={Login} />
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
      <Route path="/change-password">
        <ProtectedRoute component={ChangePassword} path="/change-password" />
      </Route>
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
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
      <LanguageProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </AuthProvider>
      </LanguageProvider>
    </Provider>
  );
}

export default App;
