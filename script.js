// When user clicks UG Results
function loadUGResults() {
    document.getElementById("output").innerHTML = "<p>Loading categories...</p>";

    fetch("/api/categories?type=ug")
        .then(res => res.json())
        .then(data => {
            let html = "<h2>Select Category</h2>";
            data.forEach(cat => {
                html += `
                    <div class='category' onclick="openForm('${cat.id}', '${cat.name}')">
                        ${cat.name}
                    </div>
                `;
            });
            document.getElementById("output").innerHTML = html;
        })
        .catch(() => {
            document.getElementById("output").innerHTML = "<p>Error loading categories.</p>";
        });
}


// Open Form for selected category
function openForm(id, name) {
    document.getElementById("output").innerHTML = `
        <h2>${name}</h2>
        <input id="roll" placeholder="Enter Roll Number" class="input"><br><br>
        <input id="dob" placeholder="DOB (DD-MM-YYYY)" class="input"><br><br>
        <button class="btn" onclick="fetchResult('${id}')">Get Result</button>
    `;
}


// Fetch result
function fetchResult(catId) {
    let roll = document.getElementById("roll").value;
    let dob = document.getElementById("dob").value;

    if (!roll || !dob) {
        alert("Please enter Roll Number and DOB!");
        return;
    }

    document.getElementById("output").innerHTML = "<p>Fetching result...</p>";

    fetch(`/api/result?category=${catId}&roll=${roll}&dob=${dob}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById("output").innerHTML = `
                <h2>Result</h2>
                <pre>${JSON.stringify(data, null, 2)}</pre>
            `;
        })
        .catch(() => {
            document.getElementById("output").innerHTML = "<p>Error loading result.</p>";
        });
}