// Main Application Script
let currentUser = null;
let userData = null;
let tasks = [];
let topEarners = [];

// Initialize the application
async function initializeApp(user) {
    currentUser = user;
    document.getElementById('user-email').textContent = user.email;
    
    // Load user data
    await loadUserData();
    
    // Setup tab navigation
    setupTabs();
    
    // Load initial tab content
    loadTabContent('tasks');
    
    // Setup event listeners
    setupEventListeners();
    
    // Check bonus claim status
    checkBonusStatus();
}

async function loadUserData() {
    try {
        const token = await currentUser.getIdToken();
        const response = await fetch('/api/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load user data');
        
        const data = await response.json();
        userData = data;
        
        // Update UI with user data
        updateUserDataUI();
    } catch (error) {
        console.error('Error loading user data:', error);
        alert('Failed to load user data. Please try again.');
    }
}

function updateUserDataUI() {
    if (!userData) return;
    
    // Update balances
    document.getElementById('total-balance').textContent = `$${userData.balance.toFixed(2)}`;
    document.getElementById('available-balance').textContent = `$${userData.available_balance.toFixed(2)}`;
    document.getElementById('bonus-balance').textContent = `$${userData.bonus.toFixed(2)}`;
    
    // Update profile tab
    document.getElementById('profile-username').value = userData.username || '';
    document.getElementById('profile-email').value = currentUser.email;
    
    // Enable/disable withdraw button based on balance
    const withdrawBtn = document.getElementById('submit-withdraw-btn');
    if (userData.available_balance >= 5) {
        withdrawBtn.disabled = false;
    } else {
        withdrawBtn.disabled = true;
    }
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active tab button
            tabButtons.forEach(btn => {
                btn.classList.remove('border-primary', 'text-primary');
                btn.classList.add('border-transparent', 'text-gray-500');
            });
            
            button.classList.add('border-primary', 'text-primary');
            button.classList.remove('border-transparent', 'text-gray-500');
            
            // Load tab content
            const tabName = button.getAttribute('data-tab');
            loadTabContent(tabName);
        });
    });
}

async function loadTabContent(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load data for the tab if needed
    switch (tabName) {
        case 'tasks':
            await loadTasks();
            await loadTopEarners();
            break;
        case 'withdraw':
            await loadWithdrawalHistory();
            break;
        case 'history':
            await loadPaymentHistory();
            break;
        case 'bonus':
            checkBonusStatus();
            break;
    }
}

async function loadTasks() {
    try {
        const token = await currentUser.getIdToken();
        const response = await fetch('/api/tasks', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load tasks');
        
        tasks = await response.json();
        renderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        document.getElementById('tasks-container').innerHTML = `
            <div class="text-center py-8 col-span-3">
                <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
                <p class="mt-2 text-gray-500">Failed to load tasks. Please try again later.</p>
            </div>
        `;
    }
}

function renderTasks() {
    const container = document.getElementById('tasks-container');
    
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 col-span-3">
                <i class="fas fa-tasks text-2xl text-gray-400"></i>
                <p class="mt-2 text-gray-500">No tasks available at the moment. Check back later!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = tasks.map(task => `
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg font-medium text-gray-900">${task.title}</h3>
                <p class="mt-2 text-sm text-gray-500">${task.instruction}</p>
                <div class="mt-4 flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-500">Reward: <span class="text-green-600">$${task.reward.toFixed(2)}</span></span>
                    <button data-task-id="${task.id}" class="view-task-btn inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        View Task
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add event listeners to task buttons
    document.querySelectorAll('.view-task-btn').forEach(button => {
        button.addEventListener('click', () => showTaskModal(button.getAttribute('data-task-id')));
    });
}

async function showTaskModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById('task-modal-title').textContent = task.title;
    document.getElementById('task-modal-description').textContent = task.instruction;
    document.getElementById('task-submission').value = '';
    
    // Clear previous event listeners
    const submitBtn = document.getElementById('submit-task-btn');
    submitBtn.replaceWith(submitBtn.cloneNode(true));
    
    // Add new event listener
    document.getElementById('submit-task-btn').addEventListener('click', async () => {
        const submission = document.getElementById('task-submission').value.trim();
        if (!submission) {
            alert('Please complete the task submission');
            return;
        }
        
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch('/api/submit-task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    taskId,
                    submission
                })
            });
            
            if (!response.ok) throw new Error('Failed to submit task');
            
            const result = await response.json();
            hideTaskModal();
            showSuccessModal('Task Submitted', 'Your task has been submitted for review. You will be notified once it is approved.');
            
            // Refresh user data
            await loadUserData();
        } catch (error) {
            console.error('Error submitting task:', error);
            alert('Failed to submit task. Please try again.');
        }
    });
    
    document.getElementById('task-modal').classList.remove('hidden');
}

function hideTaskModal() {
    document.getElementById('task-modal').classList.add('hidden');
}

async function loadTopEarners() {
    try {
        const token = await currentUser.getIdToken();
        const response = await fetch('/api/top-earners', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load top earners');
        
        topEarners = await response.json();
        renderTopEarners();
    } catch (error) {
        console.error('Error loading top earners:', error);
    }
}

function renderTopEarners() {
    const container = document.getElementById('top-earners').querySelector('tbody');
    
    if (topEarners.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
                    No top earners data available
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = topEarners.map((earner, index) => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span class="text-blue-800 font-medium">${index + 1}</span>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${earner.username}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                $${earner.total_earned.toFixed(2)}
            </td>
        </tr>
    `).join('');
}

async function loadWithdrawalHistory() {
    try {
        const token = await currentUser.getIdToken();
        const response = await fetch('/api/withdrawal-history', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load withdrawal history');
        
        const history = await response.json();
        renderWithdrawalHistory(history);
    } catch (error) {
        console.error('Error loading withdrawal history:', error);
        document.getElementById('withdraw-history').innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
                    Failed to load withdrawal history
                </td>
            </tr>
        `;
    }
}

function renderWithdrawalHistory(history) {
    const container = document.getElementById('withdraw-history').querySelector('tbody');
    
    if (history.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
                    No withdrawal history found
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = history.map(item => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(item.timestamp).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                $${item.amount.toFixed(2)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatPaymentMethod(item.method)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(item.status)}">
                    ${item.status}
                </span>
            </td>
        </tr>
    `).join('');
}

function formatPaymentMethod(method) {
    const methods = {
        'bkash': 'Bkash',
        'nagad': 'Nagad',
        'rocket': 'Rocket',
        'usdt': 'Binance USDT'
    };
    return methods[method] || method;
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'approved': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'paid': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

async function loadPaymentHistory() {
    try {
        const token = await currentUser.getIdToken();
        const response = await fetch('/api/payment-history', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load payment history');
        
        const history = await response.json();
        renderPaymentHistory(history);
    } catch (error) {
        console.error('Error loading payment history:', error);
        document.getElementById('payment-history').innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
                    Failed to load payment history
                </td>
            </tr>
        `;
    }
}

function renderPaymentHistory(history) {
    const container = document.getElementById('payment-history').querySelector('tbody');
    
    if (history.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
                    No payment history found
                </td>
            </tr>
        `;
        return;
    }
    
    container.innerHTML = history.map(item => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(item.timestamp).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">
                ${item.description}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}">
                ${item.amount >= 0 ? '+' : ''}$${Math.abs(item.amount).toFixed(2)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${item.status || 'completed'}
            </td>
        </tr>
    `).join('');
}

async function checkBonusStatus() {
    try {
        const token = await currentUser.getIdToken();
        const response = await fetch('/api/bonus-status', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to check bonus status');
        
        const data = await response.json();
        updateBonusUI(data);
    } catch (error) {
        console.error('Error checking bonus status:', error);
    }
}

function updateBonusUI(data) {
    const statusElement = document.getElementById('bonus-status');
    const timeElement = document.getElementById('bonus-time-remaining');
    const button = document.getElementById('claim-bonus-btn');
    
    if (data.can_claim) {
        statusElement.textContent = 'Ready to Claim';
        timeElement.textContent = 'You can claim your $0.02 bonus now!';
        button.disabled = false;
        button.classList.remove('bg-gray-400', 'hover:bg-gray-400');
        button.classList.add('bg-green-600', 'hover:bg-green-700');
    } else {
        statusElement.textContent = 'Bonus Claimed';
        timeElement.textContent = `Next bonus available in ${formatTimeRemaining(data.time_remaining)}`;
        button.disabled = true;
        button.classList.remove('bg-green-600', 'hover:bg-green-700');
        button.classList.add('bg-gray-400', 'hover:bg-gray-400');
    }
}

function formatTimeRemaining(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

function showSuccessModal(title, message) {
    document.getElementById('success-modal-title').textContent = title;
    document.getElementById('success-modal-message').textContent = message;
    document.getElementById('success-modal').classList.remove('hidden');
}

function hideSuccessModal() {
    document.getElementById('success-modal').classList.add('hidden');
}

function setupEventListeners() {
    // Task modal
    document.getElementById('cancel-task-btn').addEventListener('click', hideTaskModal);
    
    // Success modal
    document.getElementById('close-success-modal').addEventListener('click', hideSuccessModal);
    
    // View all earners
    document.getElementById('view-all-earners').addEventListener('click', () => {
        alert('This would show all top earners in a new page');
    });
    
    // Update password
    document.getElementById('update-password-btn').addEventListener('click', async () => {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-new-password').value;
        
        if (!newPassword || !confirmPassword) {
            alert('Please enter and confirm your new password');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        try {
            await currentUser.updatePassword(newPassword);
            alert('Password updated successfully!');
            
            // Clear fields
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-new-password').value = '';
        } catch (error) {
            console.error('Error updating password:', error);
            alert('Failed to update password: ' + error.message);
        }
    });
    
    // Withdraw request
    document.getElementById('submit-withdraw-btn').addEventListener('click', async () => {
        const amount = parseFloat(document.getElementById('withdraw-amount').value);
        const method = document.getElementById('payment-method').value;
        const accountDetails = document.getElementById('account-details').value.trim();
        
        if (isNaN(amount) || amount < 5) {
            document.getElementById('withdraw-error').textContent = 'Minimum withdrawal amount is $5.00';
            document.getElementById('withdraw-error').classList.remove('hidden');
            return;
        }
        
        if (amount > userData.available_balance) {
            document.getElementById('withdraw-error').textContent = 'Insufficient available balance';
            document.getElementById('withdraw-error').classList.remove('hidden');
            return;
        }
        
        if (!accountDetails) {
            document.getElementById('withdraw-error').textContent = 'Please enter your account details';
            document.getElementById('withdraw-error').classList.remove('hidden');
            return;
        }
        
        document.getElementById('withdraw-error').classList.add('hidden');
        
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch('/api/request-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount,
                    method,
                    account_details: accountDetails
                })
            });
            
            if (!response.ok) throw new Error('Failed to submit withdrawal request');
            
            const result = await response.json();
            showSuccessModal('Withdrawal Requested', 'Your withdrawal request has been submitted for approval.');
            
            // Refresh user data and history
            await loadUserData();
            await loadWithdrawalHistory();
            
            // Clear form
            document.getElementById('withdraw-amount').value = '';
            document.getElementById('account-details').value = '';
        } catch (error) {
            console.error('Error submitting withdrawal request:', error);
            document.getElementById('withdraw-error').textContent = error.message;
            document.getElementById('withdraw-error').classList.remove('hidden');
        }
    });
    
    // Claim bonus
    document.getElementById('claim-bonus-btn').addEventListener('click', async () => {
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch('/api/claim-bonus', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to claim bonus');
            
            const result = await response.json();
            showSuccessModal('Bonus Claimed', 'You have successfully claimed your $0.02 bonus!');
            
            // Refresh user data and bonus status
            await loadUserData();
            await checkBonusStatus();
        } catch (error) {
            console.error('Error claiming bonus:', error);
            alert('Failed to claim bonus: ' + error.message);
        }
    });
    
    // Submit report
    document.getElementById('submit-report-btn').addEventListener('click', async () => {
        const subject = document.getElementById('report-subject').value.trim();
        const description = document.getElementById('report-description').value.trim();
        
        if (!subject || !description) {
            alert('Please fill in both subject and description');
            return;
        }
        
        try {
            const token = await currentUser.getIdToken();
            const response = await fetch('/api/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subject,
                    description
                })
            });
            
            if (!response.ok) throw new Error('Failed to submit report');
            
            // Show success message
            document.getElementById('report-success').classList.remove('hidden');
            
            // Clear form
            document.getElementById('report-subject').value = '';
            document.getElementById('report-description').value = '';
            
            // Hide success message after 3 seconds
            setTimeout(() => {
                document.getElementById('report-success').classList.add('hidden');
            }, 3000);
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('Failed to submit report: ' + error.message);
        }
    });
}
