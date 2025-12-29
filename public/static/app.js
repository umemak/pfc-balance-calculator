let pfcChart = null;

async function calculatePFC() {
    // 入力値の取得
    const weight = parseFloat(document.getElementById('weight').value);
    const gender = document.getElementById('gender').value;
    const activityLevel = document.getElementById('activityLevel').value;
    const goal = document.getElementById('goal').value;

    // バリデーション
    if (!weight || weight <= 0) {
        alert('体重を正しく入力してください');
        return;
    }

    try {
        // API呼び出し
        const response = await axios.post('/api/calculate', {
            weight,
            gender,
            activityLevel,
            goal
        });

        const data = response.data;

        // 結果の表示
        displayResults(data);
        
        // 食品リストの取得と表示
        loadFoods();

        // 結果エリアを表示
        document.getElementById('results').classList.remove('hidden');
        
        // スクロール
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error:', error);
        alert('計算中にエラーが発生しました');
    }
}

function displayResults(data) {
    // 代謝情報の表示
    document.getElementById('bmr').textContent = data.bmr.toLocaleString();
    document.getElementById('tdee').textContent = data.tdee.toLocaleString();
    document.getElementById('targetCalories').textContent = data.targetCalories.toLocaleString();

    // PFC詳細情報の表示
    const { protein, fat, carbs } = data.pfc;

    // タンパク質
    document.getElementById('proteinPercent').textContent = `${protein.percentage}%`;
    document.getElementById('proteinGrams').textContent = `${protein.grams}g`;
    document.getElementById('proteinCalories').textContent = `${protein.calories}kcal`;

    // 脂質
    document.getElementById('fatPercent').textContent = `${fat.percentage}%`;
    document.getElementById('fatGrams').textContent = `${fat.grams}g`;
    document.getElementById('fatCalories').textContent = `${fat.calories}kcal`;

    // 炭水化物
    document.getElementById('carbsPercent').textContent = `${carbs.percentage}%`;
    document.getElementById('carbsGrams').textContent = `${carbs.grams}g`;
    document.getElementById('carbsCalories').textContent = `${carbs.calories}kcal`;

    // 円グラフの描画
    drawPFCChart(protein, fat, carbs);
}

function drawPFCChart(protein, fat, carbs) {
    const ctx = document.getElementById('pfcChart').getContext('2d');

    // 既存のチャートを破棄
    if (pfcChart) {
        pfcChart.destroy();
    }

    // 新しいチャートを作成
    pfcChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [
                `タンパク質 (${protein.percentage}%)`,
                `脂質 (${fat.percentage}%)`,
                `炭水化物 (${carbs.percentage}%)`
            ],
            datasets: [{
                data: [protein.grams, fat.grams, carbs.grams],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',   // red
                    'rgba(234, 179, 8, 0.8)',   // yellow
                    'rgba(34, 197, 94, 0.8)'    // green
                ],
                borderColor: [
                    'rgba(239, 68, 68, 1)',
                    'rgba(234, 179, 8, 1)',
                    'rgba(34, 197, 94, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${value}g`;
                        }
                    }
                }
            }
        }
    });
}

async function loadFoods() {
    try {
        const response = await axios.get('/api/foods');
        const foods = response.data;

        const foodsList = document.getElementById('foodsList');
        foodsList.innerHTML = '';

        foods.forEach(food => {
            const foodCard = `
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition duration-200">
                    <h3 class="font-bold text-gray-800 mb-2">${food.name}</h3>
                    <div class="space-y-1 text-sm">
                        <div class="flex justify-between">
                            <span class="text-red-600">タンパク質:</span>
                            <span class="font-semibold">${food.protein}g</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-yellow-600">脂質:</span>
                            <span class="font-semibold">${food.fat}g</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-green-600">炭水化物:</span>
                            <span class="font-semibold">${food.carbs}g</span>
                        </div>
                    </div>
                </div>
            `;
            foodsList.innerHTML += foodCard;
        });
    } catch (error) {
        console.error('Error loading foods:', error);
    }
}

// Enterキーで計算
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('weight').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calculatePFC();
        }
    });
});
