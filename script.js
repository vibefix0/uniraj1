function openCategory(type) {
    document.getElementById('formSection').classList.remove("hidden");
}

async function fetchResult() {
    const roll = document.getElementById('rollNo').value;
    const dob = document.getElementById('dob').value;

    document.getElementById('resultSection').classList.remove("hidden");
    document.getElementById('resultBox').innerText = "Fetching result...";

    const res = await fetch(`/api/result?roll=${roll}&dob=${dob}`);
    const data = await res.json();

    document.getElementById('resultBox').innerText = JSON.stringify(data, null, 2);
}