// test/spike-codeup-api.js - Codeup API Verification Script
// This script verifies the 9 key Codeup API questions for Epic 10 integration

import axios from "axios";

// Configuration - these will be determined during verification
const CODEUP_API_BASE = process.env.CODEUP_API_BASE || "https://codeup.aliyuncs.com";
const CODEUP_API_PREFIX = process.env.CODEUP_API_PREFIX || "/api/v3";
const PAT = process.env.YUNXIAO_PAT || process.env.CODEUP_PAT;

if (!PAT) {
  console.error("Error: PAT not found. Set YUNXIAO_PAT or CODEUP_PAT environment variable.");
  process.exit(1);
}

// Create Codeup API client
function createCodeupClient() {
  return axios.create({
    baseURL: `${CODEUP_API_BASE}${CODEUP_API_PREFIX}`,
    headers: {
      "x-yunxiao-token": PAT,
      "Content-Type": "application/json",
    },
    validateStatus: () => true, // Don't throw on any status code
  });
}

// Verification results tracker
const results = {
  q1_base_url: null,
  q2_pat_compatibility: null,
  q3_repo_id_type: null,
  q4_repo_list: null,
  q5_repo_view: null,
  q6_mr_list: null,
  q7_mr_view: null,
  q8_mr_create: null,
  q9_mr_workitem_link: null,
};

async function verifyQuestion1() {
  console.log("\n=== Question 1: Codeup API base URL and path prefix ===");
  console.log(`Base URL: ${CODEUP_API_BASE}`);
  console.log(`API Prefix: ${CODEUP_API_PREFIX}`);
  console.log(`Full API Base: ${CODEUP_API_BASE}${CODEUP_API_PREFIX}`);

  results.q1_base_url = {
    base_url: CODEUP_API_BASE,
    api_prefix: CODEUP_API_PREFIX,
    full_base: `${CODEUP_API_BASE}${CODEUP_API_PREFIX}`,
    status: "configured",
  };

  return results.q1_base_url;
}

async function verifyQuestion2() {
  console.log("\n=== Question 2: PAT compatibility with Codeup API ===");

  const client = createCodeupClient();

  try {
    // Try a simple endpoint to verify authentication
    // Using /user endpoint as a basic auth check
    const response = await client.get("/user");

    if (response.status === 200) {
      console.log("✓ PAT authentication successful");
      console.log(`Response status: ${response.status}`);
      console.log(`User info available: ${response.data ? "yes" : "no"}`);

      results.q2_pat_compatibility = {
        status: "compatible",
        auth_method: "x-yunxiao-token header",
        verified_endpoint: "/user",
        response_status: response.status,
        user_data: response.data,
      };
    } else if (response.status === 401) {
      console.log("✗ PAT authentication failed (401 Unauthorized)");
      results.q2_pat_compatibility = {
        status: "incompatible",
        auth_method: "x-yunxiao-token header",
        error: "401 Unauthorized",
        message: "PAT may not be valid for Codeup API or requires different authentication",
      };
    } else {
      console.log(`? Unexpected response status: ${response.status}`);
      results.q2_pat_compatibility = {
        status: "unknown",
        auth_method: "x-yunxiao-token header",
        response_status: response.status,
        error: response.data?.message || "Unknown error",
      };
    }
  } catch (err) {
    console.log(`✗ Error during authentication verification: ${err.message}`);
    results.q2_pat_compatibility = {
      status: "error",
      error: err.message,
    };
  }

  return results.q2_pat_compatibility;
}

async function verifyQuestion3() {
  console.log("\n=== Question 3: repoId identifier type ===");

  const client = createCodeupClient();

  try {
    // Try to list repositories to see what repoId format is used
    const response = await client.get("/projects");

    if (response.status === 200 && response.data?.data?.length > 0) {
      const firstRepo = response.data.data[0];
      const repoId = firstRepo.id || firstRepo.project_id || firstRepo.identifier;

      console.log(`✓ Repository list retrieved`);
      console.log(`Sample repoId: ${repoId}`);
      console.log(`repoId type: ${typeof repoId}`);

      // Determine ID type
      let idType = "unknown";
      if (typeof repoId === "number") {
        idType = "numeric";
      } else if (typeof repoId === "string") {
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(repoId)) {
          idType = "UUID";
        } else if (/^\d+$/.test(repoId)) {
          idType = "numeric string";
        } else {
          idType = "string identifier";
        }
      }

      results.q3_repo_id_type = {
        status: "determined",
        id_type: idType,
        sample_id: repoId,
        sample_repo: firstRepo,
      };
    } else {
      console.log(`? No repositories found or unexpected response format`);
      results.q3_repo_id_type = {
        status: "unable_to_determine",
        response_status: response.status,
        error: "No repositories in response",
      };
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
    results.q3_repo_id_type = {
      status: "error",
      error: err.message,
    };
  }

  return results.q3_repo_id_type;
}

async function verifyQuestion4() {
  console.log("\n=== Question 4: repo list endpoint ===");

  const client = createCodeupClient();

  try {
    const response = await client.get("/projects", {
      params: { page: 1, per_page: 10 },
    });

    if (response.status === 200) {
      console.log(`✓ repo list endpoint works`);
      console.log(`Endpoint: GET /projects`);
      console.log(`Response status: ${response.status}`);
      console.log(`Sample fields: ${response.data?.data?.[0] ? Object.keys(response.data.data[0]).join(", ") : "N/A"}`);

      results.q4_repo_list = {
        status: "verified",
        endpoint: "GET /projects",
        parameters: ["page", "per_page"],
        response_fields: response.data?.data?.[0] ? Object.keys(response.data.data[0]) : [],
        sample_response: response.data?.data?.[0],
      };
    } else {
      console.log(`? Unexpected response status: ${response.status}`);
      results.q4_repo_list = {
        status: "unknown",
        response_status: response.status,
      };
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
    results.q4_repo_list = {
      status: "error",
      error: err.message,
    };
  }

  return results.q4_repo_list;
}

async function verifyQuestion5() {
  console.log("\n=== Question 5: repo view endpoint ===");

  const client = createCodeupClient();

  try {
    // First get a repo ID from the list
    const listResponse = await client.get("/projects", { params: { per_page: 1 } });

    if (listResponse.status === 200 && listResponse.data?.data?.length > 0) {
      const repoId = listResponse.data.data[0].id;

      // Now try to view that repo
      const viewResponse = await client.get(`/projects/${repoId}`);

      if (viewResponse.status === 200) {
        console.log(`✓ repo view endpoint works`);
        console.log(`Endpoint: GET /projects/{repoId}`);
        console.log(`Response status: ${viewResponse.status}`);
        console.log(`Response fields: ${Object.keys(viewResponse.data).join(", ")}`);

        results.q5_repo_view = {
          status: "verified",
          endpoint: "GET /projects/{repoId}",
          parameters: ["repoId"],
          response_fields: Object.keys(viewResponse.data),
          sample_response: viewResponse.data,
        };
      } else {
        console.log(`? Unexpected response status: ${viewResponse.status}`);
        results.q5_repo_view = {
          status: "unknown",
          response_status: viewResponse.status,
        };
      }
    } else {
      console.log(`? Could not retrieve repo list for testing`);
      results.q5_repo_view = {
        status: "unable_to_test",
        error: "No repositories available",
      };
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
    results.q5_repo_view = {
      status: "error",
      error: err.message,
    };
  }

  return results.q5_repo_view;
}

async function verifyQuestion6() {
  console.log("\n=== Question 6: mr list endpoint ===");

  const client = createCodeupClient();

  try {
    // First get a repo ID
    const listResponse = await client.get("/projects", { params: { per_page: 1 } });

    if (listResponse.status === 200 && listResponse.data?.data?.length > 0) {
      const repoId = listResponse.data.data[0].id;

      // Try to list MRs
      const mrResponse = await client.get(`/projects/${repoId}/merge_requests`, {
        params: { page: 1, per_page: 10 },
      });

      if (mrResponse.status === 200) {
        console.log(`✓ mr list endpoint works`);
        console.log(`Endpoint: GET /projects/{repoId}/merge_requests`);
        console.log(`Response status: ${mrResponse.status}`);
        console.log(`Sample fields: ${mrResponse.data?.data?.[0] ? Object.keys(mrResponse.data.data[0]).join(", ") : "N/A"}`);

        results.q6_mr_list = {
          status: "verified",
          endpoint: "GET /projects/{repoId}/merge_requests",
          parameters: ["repoId", "page", "per_page"],
          response_fields: mrResponse.data?.data?.[0] ? Object.keys(mrResponse.data.data[0]) : [],
          sample_response: mrResponse.data?.data?.[0],
        };
      } else {
        console.log(`? Unexpected response status: ${mrResponse.status}`);
        results.q6_mr_list = {
          status: "unknown",
          response_status: mrResponse.status,
        };
      }
    } else {
      console.log(`? Could not retrieve repo list for testing`);
      results.q6_mr_list = {
        status: "unable_to_test",
        error: "No repositories available",
      };
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
    results.q6_mr_list = {
      status: "error",
      error: err.message,
    };
  }

  return results.q6_mr_list;
}

async function verifyQuestion7() {
  console.log("\n=== Question 7: mr view endpoint ===");

  const client = createCodeupClient();

  try {
    // Get repo ID and MR ID
    const listResponse = await client.get("/projects", { params: { per_page: 1 } });

    if (listResponse.status === 200 && listResponse.data?.data?.length > 0) {
      const repoId = listResponse.data.data[0].id;

      const mrListResponse = await client.get(`/projects/${repoId}/merge_requests`, {
        params: { per_page: 1 },
      });

      if (mrListResponse.status === 200 && mrListResponse.data?.data?.length > 0) {
        const mrId = mrListResponse.data.data[0].id;

        // View the MR
        const mrViewResponse = await client.get(`/projects/${repoId}/merge_requests/${mrId}`);

        if (mrViewResponse.status === 200) {
          console.log(`✓ mr view endpoint works`);
          console.log(`Endpoint: GET /projects/{repoId}/merge_requests/{mrId}`);
          console.log(`Response status: ${mrViewResponse.status}`);
          console.log(`Response fields: ${Object.keys(mrViewResponse.data).join(", ")}`);

          results.q7_mr_view = {
            status: "verified",
            endpoint: "GET /projects/{repoId}/merge_requests/{mrId}",
            parameters: ["repoId", "mrId"],
            response_fields: Object.keys(mrViewResponse.data),
            sample_response: mrViewResponse.data,
          };
        } else {
          console.log(`? Unexpected response status: ${mrViewResponse.status}`);
          results.q7_mr_view = {
            status: "unknown",
            response_status: mrViewResponse.status,
          };
        }
      } else {
        console.log(`? No merge requests found for testing`);
        results.q7_mr_view = {
          status: "unable_to_test",
          error: "No merge requests available",
        };
      }
    } else {
      console.log(`? Could not retrieve repo list for testing`);
      results.q7_mr_view = {
        status: "unable_to_test",
        error: "No repositories available",
      };
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
    results.q7_mr_view = {
      status: "error",
      error: err.message,
    };
  }

  return results.q7_mr_view;
}

async function verifyQuestion8() {
  console.log("\n=== Question 8: mr create endpoint ===");

  const client = createCodeupClient();

  try {
    // Get repo ID
    const listResponse = await client.get("/projects", { params: { per_page: 1 } });

    if (listResponse.status === 200 && listResponse.data?.data?.length > 0) {
      const repoId = listResponse.data.data[0].id;

      // Try to create an MR (this will likely fail due to missing branches, but we can see the endpoint)
      const createResponse = await client.post(`/projects/${repoId}/merge_requests`, {
        title: "Test MR",
        source_branch: "test-source",
        target_branch: "main",
      });

      console.log(`Endpoint: POST /projects/{repoId}/merge_requests`);
      console.log(`Response status: ${createResponse.status}`);

      if (createResponse.status === 201 || createResponse.status === 200) {
        console.log(`✓ mr create endpoint works`);
        console.log(`Response fields: ${Object.keys(createResponse.data).join(", ")}`);

        results.q8_mr_create = {
          status: "verified",
          endpoint: "POST /projects/{repoId}/merge_requests",
          parameters: ["repoId", "title", "source_branch", "target_branch"],
          response_fields: Object.keys(createResponse.data),
          sample_response: createResponse.data,
        };
      } else {
        console.log(`? Response status: ${createResponse.status} (may be expected if branches don't exist)`);
        results.q8_mr_create = {
          status: "endpoint_exists",
          endpoint: "POST /projects/{repoId}/merge_requests",
          response_status: createResponse.status,
          error: createResponse.data?.message || "Test MR creation failed",
        };
      }
    } else {
      console.log(`? Could not retrieve repo list for testing`);
      results.q8_mr_create = {
        status: "unable_to_test",
        error: "No repositories available",
      };
    }
  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
    results.q8_mr_create = {
      status: "error",
      error: err.message,
    };
  }

  return results.q8_mr_create;
}

async function verifyQuestion9() {
  console.log("\n=== Question 9: MR and workitem association mechanism ===");

  console.log("This question requires manual investigation of:");
  console.log("1. Codeup API documentation for workitem linking");
  console.log("2. Whether MR creation API accepts workitem_id parameter");
  console.log("3. Whether commit message keywords (e.g., 'Fixes #123') are supported");
  console.log("4. Whether there's a separate endpoint to link MR to workitems");

  results.q9_mr_workitem_link = {
    status: "requires_manual_investigation",
    notes: "Check Codeup API docs for workitem linking mechanism",
    possible_approaches: [
      "API parameter in mr create endpoint",
      "Commit message keywords",
      "Separate linking endpoint",
    ],
  };

  return results.q9_mr_workitem_link;
}

async function main() {
  console.log("=== Codeup API Verification Script ===");
  console.log(`Start time: ${new Date().toISOString()}`);

  try {
    await verifyQuestion1();
    await verifyQuestion2();
    await verifyQuestion3();
    await verifyQuestion4();
    await verifyQuestion5();
    await verifyQuestion6();
    await verifyQuestion7();
    await verifyQuestion8();
    await verifyQuestion9();

    console.log("\n=== Verification Summary ===");
    console.log(JSON.stringify(results, null, 2));

    // Save results to file
    const fs = await import("fs");
    fs.writeFileSync(
      "test/spike-codeup-api-results.json",
      JSON.stringify(results, null, 2)
    );
    console.log("\nResults saved to test/spike-codeup-api-results.json");
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
}

main();
