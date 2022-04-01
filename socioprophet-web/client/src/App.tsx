/**
 *
 *  File: App.tsx
 *  Author: William Jones
 *  Desciption: Main application wrapper for all view routes
 *
 */

import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';

/**
 *  view imports (latest version)
 *
 */
import Terms from './views/legal/Terms';
import Privacy from './views/legal/Privacy';
import NotFound from './views/not-found/NotFound';

/***************************************************/

// import ComingSoon from './components/coming-soon/ComingSoon';
import Landing from './components/landing/Landing';
import EmailSubmission from './components/landing/forms/email-submission/EmailSubmission';
import Survey from './components/survey/Survey';

import Alpha from './components/dashboard/Alpha';

import PrivateRoute from './components/private-route/PrivateRoute';
import { AuthProvider } from './authentication/contexts/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';

import './App.scss';
import './components/global-styles/button.scss';
import './components/global-styles/inputText.scss';

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className="app">
            <Switch>
              <Route exact path="/" component={Landing} />
              {/* <Route exact path="/" component={ComingSoon} /> */}
              <Route exact path="/submit" component={EmailSubmission} />
              <Route path="/terms-of-use" component={Terms} />
              <Route path="/privacy-policy" component={Privacy} />
              <PrivateRoute path="/get-started" component={Survey} />
              <PrivateRoute exact path="/alpha" component={Alpha} />
              <Route component={NotFound} />
              {/* <Route path="/account" component={Account} />
              {/* <Route path="/password-reset" component={PasswordReset} /> */}
              {/* <PrivateRoute path="/dashboard" component={UInterface} /> */}
              {/* <PrivateRoute path="/terminal" component={PopoutTerminal} />  */}
            </Switch>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};
export default App;
