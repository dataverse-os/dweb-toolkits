import React from "react";

import { Navigate, useRoutes } from "react-router-dom";

import { User, Admin } from "../pages";

const Router = () => {
  return useRoutes([
    {
      path: "/",
      element: <Navigate to='/user' />,
    },
    {
      path: "/user",
      element: <User />,
    },
    {
      path: "/admin",
      element: <Admin />,
    },
  ]);
};

export default Router;
