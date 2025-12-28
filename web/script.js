// import contractABI from "./abi.json";
async function loadABI() {
  try {
    const response = await fetch("./abi.json");
    const contractABI = await response.json();
    return contractABI;
  } catch (error) {
    console.error("Error loading ABI:", error);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const contractAddress = "0x9f62085AC4fE25385d90d886bCcc08eE63a97d64";

  const contractABI = await loadABI();
  if (!contractABI) return;

  // Check if Web3 is available
  if (typeof Web3 !== "undefined") {
    const web3 = new Web3(window.ethereum);

    // Initialize contract
    let contract;
    if (contractABI && contractAddress) {
      contract = new web3.eth.Contract(contractABI, contractAddress);
    }

    const connectBtn = document.getElementById("connect-btn");

    // Connect the MetaMask wallet
    connectBtn.addEventListener("click", connectWallet);

    async function connectWallet() {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          console.log("Connected:", accounts[0]);
          setConnected(accounts[0]);
          workerShow();

          // Check if user is already registered
          await checkUserRegistration(accounts[0]);
        } catch (err) {
          if (err.code === 4001) {
            console.log("Please connect to MetaMask.");
          } else {
            console.error(err);
          }
        }
      } else {
        console.error("No web3 provider detected");
      }
    }

    // Check if user is registered
    async function checkUserRegistration(userAddress) {
      try {
        // Call the public mapping `users`
        const userData = await contract.methods.users(userAddress).call();
        console.log("User data:", userData);

        const isRegistered = userData.isRegistered;
        const roleNumber = parseInt(userData.role); // Role is returned as string/number

        const workerRole = document.querySelector(".worker-role");
        const workerRoleRegister = document.querySelector(
          ".worker-role-register"
        );

        if (isRegistered) {
          // if user is registered
          // Hide registration buttons
          workerRoleRegister.style.display = "none";

          // Show role
          const roleName = getRoleName(roleNumber);
          workerRole.innerHTML = `<p>You are registered as <span class="text-bold">${roleName}</span></p>`;
        } else {
          // if user is not registered
          // Show registration buttons
          workerRoleRegister.style.display = "flex";
          workerRole.innerHTML = "";

          // Add event listeners to role buttons
          setupRoleButtons(userAddress);
        }
      } catch (error) {
        console.error("Error checking registration:", error);
      }
    }

    // Helper function to convert role number to name
    function getRoleName(roleNumber) {
      const roles = [
        "None",
        "Farmer",
        "Slaughterer",
        "Distributor",
        "Retailer",
      ];
      return roles[roleNumber] || "Unknown";
    }

    // Setup role button click handlers
    function setupRoleButtons(userAddress) {
      const buttons = document.querySelectorAll(".worker-role-register button");

      buttons.forEach((button, index) => {
        button.addEventListener("click", async () => {
          // Role numbers: Farmer=1, Slaughterer=2, Distributor=3, Retailer=4
          const roleNumber = index + 1;

          try {
            // Show loading
            button.textContent = "Registering...";
            button.disabled = true;

            // Get current account
            const accounts = await web3.eth.getAccounts();
            const fromAddress = accounts[0];

            // Call registerUser function
            await contract.methods
              .registerUser(roleNumber)
              .send({ from: fromAddress })
              .on("transactionHash", (hash) => {
                console.log("Transaction hash:", hash);
              })
              .on("receipt", (receipt) => {
                console.log("Registration successful!");

                // Update UI
                const roleName = getRoleName(roleNumber);
                document.querySelector(
                  ".worker-role"
                ).innerHTML = `<p>You are now registered as <span class="text-bold">${roleName}</span></p>`;
                document.querySelector(".worker-role-register").style.display =
                  "none";
              })
              .on("error", (error) => {
                console.error("Registration error:", error);
                button.textContent = getRoleName(roleNumber);
                button.disabled = false;
              });
          } catch (error) {
            console.error("Error:", error);
            button.textContent = getRoleName(roleNumber);
            button.disabled = false;
          }
        });
      });
    }
  } else {
    console.error("Web3 library not loaded");
  }
});

// Show acc address
const accAddr = document.querySelector(".worker-address");
function setConnected(address) {
  accAddr.innerText = "Connected: " + address;
}

const worker = document.querySelector(".worker");
function workerShow() {
  worker.style.display = "flex";
}

// Show tracker
const consumerBtn = document.getElementById("consumer-btn");
const consumer = document.querySelector(".consumer");
consumerBtn.addEventListener("click", () => {
  consumer.style.display = "flex";
});
