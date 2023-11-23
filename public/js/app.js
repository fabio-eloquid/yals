let auth0Client = null;

const fetchAuthConfig = () => fetch("/auth_config.json");

const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();
  console.log("domain "+config.domain);
  console.log("clientId "+config.clientId);
  console.log("audience "+config.audience);

  auth0Client = await createAuth0Client({
    domain: config.domain,
    //clientId: config.clientId,
    client_id: config.clientId,
    authorizationParams: {
      audience: config.audience   // NEW - add the audience value
    }
  });
   console.log('> auth0 obj', auth0Client);

};

const callApi = async () => {
  try {

    // Get the access token from the Auth0 client
    const token = await auth0Client.getTokenSilently();

    // Make the call to the API, setting the token
    // in the Authorization header
    const response = await fetch("/api/external", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Fetch the JSON result
    const responseData = await response.json();

    // Display the result in the output element
    const responseElement = document.getElementById("api-call-result");

    responseElement.innerText = JSON.stringify(responseData, {}, 2);

} catch (e) {
    // Display errors in the console
    console.error(e);
  }
};

window.onload = async () => {
  await configureClient();

  // NEW - update the UI state
  updateUI();

  const isAuthenticated = await auth0Client.isAuthenticated();

  if (isAuthenticated) {
    // show the gated content
    return;
  }
  // Check for the code and state parameters
  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {
	  const params = new URLSearchParams(query);
	  const code = params.get('code');
	  const state = params.get('state');

	  if (code && state) {
		// Display code and state on the screen
		document.getElementById('ipt-access-token').textContent = `Code: ${code}`;
		document.getElementById('ipt-state').textContent = `State: ${state}`;
		console.log(code);
		console.log(state);


		// Process the login state
		await auth0Client.handleRedirectCallback();

		updateUI();

		// Use replaceState to redirect the user away and remove the querystring parameters
		window.history.replaceState({}, document.title, "/");
	  }
  }
};

// NEW
const updateUI = async () => {
  const isAuthenticated = await auth0Client.isAuthenticated();

  document.getElementById("btn-logout").disabled = !isAuthenticated;
  document.getElementById("btn-login").disabled = isAuthenticated;

  // NEW - enable the button to call the API
  document.getElementById("btn-call-api").disabled = !isAuthenticated;
  
  // NEW - add logic to show/hide gated content after authentication
  if (isAuthenticated) {
    document.getElementById("gated-content").classList.remove("hidden");

    document.getElementById(
      "ipt-access-token"
    ).innerHTML = await auth0Client.getTokenSilently();

    document.getElementById("ipt-user-profile").textContent = JSON.stringify(
      await auth0Client.getUser()
    );

  } else {
    document.getElementById("gated-content").classList.add("hidden");
  }
};

const login = async () => {
  await auth0Client.loginWithRedirect( // authorizationParams:
  {
    redirect_uri: window.location.origin
  });
};

const logout = () => {
  auth0Client.logout( //  logoutParams:
  {
    returnTo: window.location.origin
  });
};