import { NextPage, NextPageContext } from "next";
import { useContext, useEffect } from "react";
import { Can } from "../components/Can";

import { AuthContext } from "../contexts/AuthContext";
import { setupAPIClient } from "../services/api";
import { api } from "../services/apiClient";
import { withSSRAuth } from "../utils/withSSRAuth";

const Dashboard: NextPage = () => {
  const { user, signOut } = useContext(AuthContext);

  useEffect(() => {
    api.get('/me')
      .then(res => console.log(res))
      .catch(err => console.log(err));
  }, []);

  return (
    <>
      <h1>Dashboard: {user?.email}</h1>
      <button onClick={() => signOut()}>Sign Out</button>
      <Can permissions={['metrics.list']}>
        <div>Métricas</div>
      </Can>
    </>
  )
}

export default Dashboard;

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx as unknown as NextPageContext);
  const response = await apiClient.get('/me');

  console.log(response.data);
  return {
    props: {}
  }
});