import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Routes>
          <Route
            path="/"
            element={
              <div className="container py-5 text-center">
                <h1 className="fw-bold mb-3">SecureBank</h1>
                <p className="text-muted">Modern Digital Banking Migration</p>
                <div className="badge bg-success p-2">Target Frontend Skeleton Ready</div>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}
