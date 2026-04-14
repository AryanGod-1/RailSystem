class TrainApp {
    constructor() {
        this.sections = ['sec-login', 'sec-dashboard', 'sec-booking', 'sec-payment', 'sec-ticket', 'sec-contact'];
        this.apiKey = localStorage.getItem('nrs_api_key') || '';
        this.user = JSON.parse(localStorage.getItem('nrs_user')) || null;
        this.currentBooking = {};
        
        this.init();
    }

    init() {
        if (this.user) {
            this.updateUserDisplay();
            this.navigate('dashboard');
        } else {
            this.navigate('login');
        }

        if (!this.apiKey) {
            document.getElementById('api-key-banner').style.display = 'flex';
        } else {
            document.getElementById('api-key-banner').style.display = 'none';
        }

        // Set default dates
        const dateInput = document.getElementById('search-date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
            dateInput.min = today;
        }
    }

    /* Navigation & Tabs */
    navigate(target) {
        if (target === 'dashboard' && !this.user) {
            target = 'login';
        }

        const targetId = `sec-${target}`;

        this.sections.forEach(sec => {
            const el = document.getElementById(sec);
            if (el && sec !== targetId) {
                el.classList.remove('active');
                el.style.display = 'none';
            }
        });

        const targetEl = document.getElementById(targetId);
        if (targetEl) {
            targetEl.style.display = 'block';
            setTimeout(() => targetEl.classList.add('active'), 10);
        }

        // Check auth status for nav buttons
        if (target === 'login') {
            document.getElementById('user-display').style.display = 'none';
            document.getElementById('login-nav-btn').style.display = 'inline-block';
        } else {
            this.updateUserDisplay();
        }
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
        
        const btn = document.querySelector(`button[onclick="app.switchTab('${tabId}')"]`);
        if(btn) btn.classList.add('active');
        
        const tab = document.getElementById(`tab-${tabId}`);
        if(tab) tab.style.display = 'block';

        // Hide results when switching tabs
        document.getElementById('search-results-container').style.display = 'none';
        document.getElementById('single-result-container').style.display = 'none';
    }

    /* Auth */
    handleLogin(e) {
        e.preventDefault();
        const user = document.getElementById('login-username').value;
        this.setUser(user);
    }

    handleGuestLogin() {
        this.setUser('GuestUser');
    }

    setUser(username) {
        this.user = { name: username, isLoggedIn: true };
        localStorage.setItem('nrs_user', JSON.stringify(this.user));
        this.updateUserDisplay();
        this.navigate('dashboard');
    }

    logout() {
        this.user = null;
        localStorage.removeItem('nrs_user');
        this.navigate('login');
    }

    updateUserDisplay() {
        if (this.user) {
            document.getElementById('user-display').style.display = 'flex';
            document.getElementById('username-text').innerText = this.user.name;
            document.getElementById('login-nav-btn').style.display = 'none';
        }
    }

    /* API and Settings */
    promptApiKey() {
        const key = prompt("Enter your IndianRailAPI key for live data.\nLeave blank to continue using Mock Data.");
        if (key !== null) {
            this.apiKey = key;
            localStorage.setItem('nrs_api_key', key);
            if (key) {
                document.getElementById('api-key-banner').style.display = 'none';
                alert("API Key saved! Requests will now use live data (if CORS allows).");
            } else {
                document.getElementById('api-key-banner').style.display = 'flex';
            }
        }
    }

    swapStations() {
        const from = document.getElementById('search-from').value;
        const to = document.getElementById('search-to').value;
        document.getElementById('search-from').value = to;
        document.getElementById('search-to').value = from;
    }

    showLoader(show) {
        document.getElementById('search-loader').style.display = show ? 'block' : 'none';
    }

    /* API Calls */
    async fetchJson(url) {
        try {
            // Using a simple CORS proxy if needed, but we'll try directly first
            const response = await fetch(url);
            if (!response.ok) throw new Error("Network Error");
            return await response.json();
        } catch (e) {
            console.error("Fetch failed", e);
            throw e;
        }
    }

    /* Search Trains Between Stations */
    async searchTrains(e) {
        e.preventDefault();
        const from = document.getElementById('search-from').value.toUpperCase();
        const to = document.getElementById('search-to').value.toUpperCase();
        const date = document.getElementById('search-date').value;

        this.showLoader(true);
        document.getElementById('search-results-container').style.display = 'none';
        document.getElementById('single-result-container').style.display = 'none';

        let data;
        let isMock = false;

        if (this.apiKey) {
            try {
                const url = `http://indianrailapi.com/api/v2/TrainBetweenStation/apikey/${this.apiKey}/From/${from}/To/${to}`;
                const result = await this.fetchJson(url);
                if (result.ResponseCode === "200") {
                    data = result;
                } else {
                    throw new Error(result.Message || "API Error");
                }
            } catch (err) {
                console.warn("Live API failed, using mock data. Note: Browser CORS blocks might be causing this.", err);
                isMock = true;
                data = this.getMockBetweenStations(from, to);
            }
        } else {
            isMock = true;
            data = this.getMockBetweenStations(from, to);
        }

        setTimeout(() => {
            this.showLoader(false);
            this.renderTrainList(data.Trains, from, to, date, isMock);
        }, 800); // Artificial delay for effect
    }

    getMockBetweenStations(from, to) {
        return {
            Trains: [
                { TrainNo: "12004", TrainName: "SHATABDI EXP", SourceTime: "06:00", DestinationTime: "12:00", Classes: "CC, EC", TravelTime: "06:00" },
                { TrainNo: "12952", TrainName: "RAJDHANI EXP", SourceTime: "16:30", DestinationTime: "08:35", Classes: "1A, 2A, 3A", TravelTime: "16:05" },
                { TrainNo: "12239", TrainName: "DURONTO EXP", SourceTime: "23:00", DestinationTime: "14:20", Classes: "1A, 2A, 3A, SL", TravelTime: "15:20" }
            ]
        };
    }

    renderTrainList(trains, from, to, date, isMock) {
        const container = document.getElementById('search-results-container');
        const list = document.getElementById('trains-list');
        list.innerHTML = '';
        container.style.display = 'block';

        if (!trains || trains.length === 0) {
            list.innerHTML = `<div class="card text-center"><p>No trains found between ${from} and ${to} on ${date}.</p></div>`;
            return;
        }

        trains.forEach(t => {
            // Encode details to pass via onclick
            const tData = encodeURIComponent(JSON.stringify({...t, from, to, date}));
            
            list.innerHTML += `
                <div class="train-card">
                    <div class="train-header">
                        <div class="t-name">${t.TrainName} <span class="t-no">${t.TrainNo}</span></div>
                        ${isMock ? '<span style="color:#eab308; font-size: 0.8rem; border:1px solid #eab308; padding:2px 5px; border-radius:4px;">Mock Data</span>' : ''}
                    </div>
                    <div class="train-times">
                        <div class="time-block">
                            <h3>${t.SourceTime}</h3>
                            <p>${from}</p>
                        </div>
                        <div class="duration">
                            <span>${t.TravelTime || 'Duration Info'}</span>
                        </div>
                        <div class="time-block">
                            <h3>${t.DestinationTime}</h3>
                            <p>${to}</p>
                        </div>
                    </div>
                    <div class="train-classes">
                        ${(t.Classes || "SL, 3A, 2A").split(',').map(c => `<span class="class-badge">${c.trim()}</span>`).join('')}
                    </div>
                    <div class="book-action">
                        <button class="btn-primary" onclick="app.initBooking('${tData}')">Book Now</button>
                    </div>
                </div>
            `;
        });
    }

    /* Search Train Info */
    async searchInfo(e) {
        e.preventDefault();
        const trainno = document.getElementById('info-train-no').value;
        this.showLoader(true);
        document.getElementById('search-results-container').style.display = 'none';

        let data;
        if (this.apiKey) {
            try {
                const url = `http://indianrailapi.com/api/v2/TrainInformation/apikey/${this.apiKey}/TrainNumber/${trainno}/`;
                data = await this.fetchJson(url);
                if (data.ResponseCode !== "200") throw new Error();
            } catch {
                data = this.getMockInfo(trainno);
            }
        } else {
            data = this.getMockInfo(trainno);
        }

        setTimeout(() => {
            this.showLoader(false);
            const rContainer = document.getElementById('single-result-container');
            if (!data.TrainName) {
                 rContainer.innerHTML = `<div class="card"><p>Failed to get info for train ${trainno}</p></div>`;
            } else {
                rContainer.innerHTML = `
                    <div class="card">
                        <div class="train-header">
                            <div class="t-name">${data.TrainName} <span class="t-no">${data.TrainNo}</span></div>
                        </div>
                        <table class="data-table mt-4">
                            <tr><th>Source Station:</th><td>${data.Source.Code} - ${data.Source.Name}</td></tr>
                            <tr><th>Destination Station:</th><td>${data.Destination.Code} - ${data.Destination.Name}</td></tr>
                            <tr><th>Runs On:</th><td>${data.DaysOfRun || 'All Days'}</td></tr>
                            <tr><th>Classes:</th><td>${data.Classes || '1A, 2A, 3A, SL'}</td></tr>
                        </table>
                    </div>
                `;
            }
            rContainer.style.display = 'block';
        }, 500);
    }

    getMockInfo(no) {
        return {
            TrainNo: no,
            TrainName: "SUPERFAST EXP",
            Source: { Code: "NDLS", Name: "New Delhi" },
            Destination: { Code: "BCT", Name: "Mumbai Central" },
            DaysOfRun: "Mon, Wed, Fri",
            Classes: "1A, 2A, 3A, SL"
        };
    }

    /* Search Train Schedule */
    async searchSchedule(e) {
        e.preventDefault();
        const trainno = document.getElementById('schedule-train-no').value;
        this.showLoader(true);
        document.getElementById('search-results-container').style.display = 'none';

        let data;
        if (this.apiKey) {
            try {
                const url = `http://indianrailapi.com/api/v2/TrainSchedule/apikey/${this.apiKey}/TrainNumber/${trainno}/`;
                data = await this.fetchJson(url);
                if (data.ResponseCode !== "200") throw new Error();
            } catch {
                data = this.getMockSchedule(trainno);
            }
        } else {
            data = this.getMockSchedule(trainno);
        }

        setTimeout(() => {
            this.showLoader(false);
            const rContainer = document.getElementById('single-result-container');
            
            if(!data.Route || data.Route.length === 0){
                rContainer.innerHTML = `<div class="card"><p>Failed to get schedule for train ${trainno}</p></div>`;
            } else {
                let html = `
                <div class="card">
                    <div class="train-header">
                        <div class="t-name">Schedule for <span class="t-no">${data.TrainNumber || trainno}</span></div>
                    </div>
                    <div style="overflow-x:auto;">
                    <table class="data-table mt-4">
                        <thead>
                            <tr><th>Station</th><th>Arr. Time</th><th>Dep. Time</th><th>Distance</th><th>Day</th></tr>
                        </thead>
                        <tbody>
                `;
                data.Route.forEach(s => {
                    html += `<tr>
                        <td>${s.StationName} (${s.StationCode})</td>
                        <td>${s.ArrivalTime}</td>
                        <td>${s.DepartureTime}</td>
                        <td>${s.Distance} km</td>
                        <td>${s.Day}</td>
                    </tr>`;
                });
                html += `</tbody></table></div></div>`;
                rContainer.innerHTML = html;
            }
            rContainer.style.display = 'block';
        }, 500);
    }

    getMockSchedule(no) {
        return {
            TrainNumber: no,
            Route: [
                { StationName: "New Delhi", StationCode: "NDLS", ArrivalTime: "Source", DepartureTime: "16:00", Distance: "0", Day: "1" },
                { StationName: "Kota Jn", StationCode: "KOTA", ArrivalTime: "20:30", DepartureTime: "20:40", Distance: "465", Day: "1" },
                { StationName: "Vadodara Jn", StationCode: "BRC", ArrivalTime: "03:15", DepartureTime: "03:25", Distance: "992", Day: "2" },
                { StationName: "Mumbai Central", StationCode: "BCT", ArrivalTime: "08:35", DepartureTime: "Dest", Distance: "1384", Day: "2" }
            ]
        };
    }

    /* Booking Logic */
    initBooking(trainDataStr) {
        const t = JSON.parse(decodeURIComponent(trainDataStr));
        this.currentBooking = { train: t, passengers: [], totalAmt: 0 };
        
        // Reset forms
        document.getElementById('passenger-rows').innerHTML = `
            <div class="passenger-row form-row">
                <div class="form-group p-name">
                    <label>Name</label>
                    <input type="text" class="pass-name" required placeholder="Passenger Name">
                </div>
                <div class="form-group p-age">
                    <label>Age</label>
                    <input type="number" class="pass-age" required min="1" max="120" placeholder="Age">
                </div>
                <div class="form-group p-gender">
                    <label>Gender</label>
                    <select class="pass-gender" required>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="T">Transgender</option>
                    </select>
                </div>
                <div class="form-group p-berth">
                    <label>Berth Pref</label>
                    <select class="pass-berth">
                        <option value="No Preference">No Preference</option>
                        <option value="Lower">Lower</option>
                        <option value="Middle">Middle</option>
                        <option value="Upper">Upper</option>
                        <option value="Side Lower">Side Lower</option>
                        <option value="Side Upper">Side Upper</option>
                    </select>
                </div>
            </div>
        `;
        document.getElementById('passenger-form').reset();

        // summary details
        document.getElementById('booking-train-summary').innerHTML = `
            <div class="train-header">
                <div class="t-name">${t.TrainName} <span class="t-no">${t.TrainNo}</span></div>
            </div>
            <div class="train-times mt-4">
                <div class="time-block">
                    <h3>${t.SourceTime || 'N/A'}</h3>
                    <p>${t.from || 'SRC'}</p>
                </div>
                <div class="duration">
                    <span>${t.date || 'Journey Date'}</span>
                </div>
                <div class="time-block">
                    <h3>${t.DestinationTime || 'N/A'}</h3>
                    <p>${t.to || 'DST'}</p>
                </div>
            </div>
        `;

        this.navigate('booking');
    }

    addPassengerRow() {
        const row = document.createElement('div');
        row.className = 'passenger-row form-row mt-4';
        row.innerHTML = `
            <div class="form-group p-name">
                <label>Name</label>
                <input type="text" class="pass-name" required placeholder="Passenger Name">
            </div>
            <div class="form-group p-age">
                <label>Age</label>
                <input type="number" class="pass-age" required min="1" max="120" placeholder="Age">
            </div>
            <div class="form-group p-gender">
                <label>Gender</label>
                <select class="pass-gender" required>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="T">Transgender</option>
                </select>
            </div>
            <div class="form-group p-berth">
                <label>Berth Pref</label>
                <select class="pass-berth">
                    <option value="No Preference">No Preference</option>
                    <option value="Lower">Lower</option>
                    <option value="Middle">Middle</option>
                    <option value="Upper">Upper</option>
                    <option value="Side Lower">Side Lower</option>
                    <option value="Side Upper">Side Upper</option>
                </select>
            </div>
            <button type="button" class="btn-outline btn-sm" onclick="this.parentElement.remove()" style="align-self: center; margin-bottom: 0.5rem;"><i class="fa-solid fa-trash"></i></button>
        `;
        document.getElementById('passenger-rows').appendChild(row);
    }

    proceedToPayment(e) {
        e.preventDefault();
        // Gather passengers
        const rows = document.querySelectorAll('.passenger-row');
        this.currentBooking.passengers = [];
        
        let valid = true;
        rows.forEach(r => {
            const n = r.querySelector('.pass-name').value;
            const a = r.querySelector('.pass-age').value;
            const g = r.querySelector('.pass-gender').value;
            const b = r.querySelector('.pass-berth').value;
            if(!n || !a) valid=false;
            this.currentBooking.passengers.push({name: n, age: a, gender: g, berth: b});
        });

        if(!valid) return;

        // Base fare 850 * per head + random taxes
        const pt = this.currentBooking.passengers.length;
        this.currentBooking.baseFare = 850 * pt;
        this.currentBooking.totalAmt = this.currentBooking.baseFare + 17.70;

        document.getElementById('razor-amount').innerText = `₹${this.currentBooking.totalAmt.toFixed(2)}`;
        
        // Reset payment ui
        document.querySelector('.razor-body').style.display = 'block';
        document.getElementById('payment-processing').style.display = 'none';
        document.getElementById('payment-success').style.display = 'none';
        document.getElementById('dummy-upi').value = '';

        // Select method options ui
        document.querySelectorAll('.method-option').forEach(m => {
            m.onclick = () => {
                document.querySelectorAll('.method-option').forEach(x=>x.classList.remove('active'));
                m.classList.add('active');
            }
        });

        this.navigate('payment');
    }

    simulatePayment() {
        const methodActive = !!document.querySelector('.method-option.active');
        if(!document.getElementById('dummy-upi').value) {
            alert('Please enter valid details to proceed');
            return;
        }

        document.querySelector('.razor-body').style.display = 'none';
        document.getElementById('payment-processing').style.display = 'block';

        setTimeout(() => {
            document.getElementById('payment-processing').style.display = 'none';
            document.getElementById('payment-success').style.display = 'block';
            
            setTimeout(() => {
                this.generateTicket();
            }, 1500);

        }, 2000);
    }

    generateTicket() {
        // Generate pseudo PNR
        const pnr = Math.floor(Math.random() * 8999999999) + 1000000000;
        document.getElementById('ticket-pnr').innerText = pnr;

        const t = this.currentBooking.train;
        document.getElementById('ticket-journey').innerHTML = `
            <table class="data-table">
                <tr><th>Train No. / Name</th><td><b>${t.TrainNo}</b> / ${t.TrainName}</td></tr>
                <tr><th>Date Of Journey</th><td>${t.date || new Date().toISOString().split('T')[0]}</td></tr>
                <tr><th>From</th><td>${t.from}</td></tr>
                <tr><th>To</th><td>${t.to}</td></tr>
            </table>
        `;

        let plist = '';
        this.currentBooking.passengers.forEach((p, index) => {
            // Fake seat generator
            const coach = "S" + (Math.floor(Math.random()*9) + 1);
            const seat = Math.floor(Math.random()*72) + 1;
            const status = `CNF / ${coach} / ${seat} / ${p.berth !== 'No Preference' ? p.berth : 'SU'}`;
            
            plist += `<tr>
                <td>${p.name}</td>
                <td>${p.age}</td>
                <td>${p.gender}</td>
                <td>${status}</td>
            </tr>`;
        });
        document.getElementById('ticket-passengers').innerHTML = plist;

        document.getElementById('ticket-fare').innerText = `₹${this.currentBooking.baseFare.toFixed(2)}`;
        document.getElementById('ticket-total').innerText = `₹${this.currentBooking.totalAmt.toFixed(2)}`;

        this.navigate('ticket');
    }
}

// Initialization on load
const app = new TrainApp();
