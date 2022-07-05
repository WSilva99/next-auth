import { NextPage, NextPageContext } from "next"
import decode from "jwt-decode"

import { setupAPIClient } from "../services/api"
import { withSSRAuth } from "../utils/withSSRAuth"

const Metrics: NextPage = () => {
  return (
    <>
      <h1>Métricas</h1>
    </>
  )
}

export default Metrics;

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx as unknown as NextPageContext);
  const response = await apiClient.get('/me');
  console.log(response.data);
  return {
    props: {}
  }
});