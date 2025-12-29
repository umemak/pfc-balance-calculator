import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// PFCバランス計算API
app.post('/api/calculate', async (c) => {
  try {
    const body = await c.req.json()
    const { weight, gender, activityLevel, goal } = body

    // バリデーション
    if (!weight || !gender || !activityLevel || !goal) {
      return c.json({ error: '必要なパラメータが不足しています' }, 400)
    }

    if (weight <= 0 || weight > 300) {
      return c.json({ error: '体重は1〜300kgの範囲で入力してください' }, 400)
    }

    // 基礎代謝量の計算（簡易版）
    let bmr = 0
    if (gender === 'male') {
      bmr = 13.397 * weight + 4.799 * 170 - 5.677 * 30 + 88.362
    } else {
      bmr = 9.247 * weight + 3.098 * 160 - 4.330 * 30 + 447.593
    }

    // 活動レベルによる補正
    const activityMultipliers: { [key: string]: number } = {
      sedentary: 1.2,      // ほとんど運動しない
      light: 1.375,        // 軽い運動
      moderate: 1.55,      // 中程度の運動
      active: 1.725,       // 激しい運動
      veryActive: 1.9      // 非常に激しい運動
    }

    const tdee = bmr * activityMultipliers[activityLevel]

    // 目標に応じたカロリー調整
    let targetCalories = tdee
    let proteinRatio = 0.25
    let fatRatio = 0.25
    let carbRatio = 0.5

    if (goal === 'lose') {
      // 減量：-500kcal
      targetCalories = tdee - 500
      proteinRatio = 0.3  // タンパク質多め
      fatRatio = 0.25
      carbRatio = 0.45
    } else if (goal === 'gain') {
      // 増量：+500kcal
      targetCalories = tdee + 500
      proteinRatio = 0.25
      fatRatio = 0.25
      carbRatio = 0.5
    }

    // PFC計算（g）
    const protein = Math.round((targetCalories * proteinRatio) / 4)  // タンパク質: 4kcal/g
    const fat = Math.round((targetCalories * fatRatio) / 9)          // 脂質: 9kcal/g
    const carbs = Math.round((targetCalories * carbRatio) / 4)       // 炭水化物: 4kcal/g

    // 結果
    const result = {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      pfc: {
        protein: {
          grams: protein,
          calories: protein * 4,
          percentage: Math.round(proteinRatio * 100)
        },
        fat: {
          grams: fat,
          calories: fat * 9,
          percentage: Math.round(fatRatio * 100)
        },
        carbs: {
          grams: carbs,
          calories: carbs * 4,
          percentage: Math.round(carbRatio * 100)
        }
      }
    }

    return c.json(result)
  } catch (error) {
    console.error('Calculation error:', error)
    return c.json({ error: '計算中にエラーが発生しました' }, 500)
  }
})

// 食品データベースAPI（サンプルデータ）
app.get('/api/foods', (c) => {
  const foods = [
    { id: 1, name: '鶏むね肉（100g）', protein: 23, fat: 1.5, carbs: 0 },
    { id: 2, name: '卵（1個）', protein: 6, fat: 5, carbs: 0.3 },
    { id: 3, name: '白米（茶碗1杯）', protein: 3.8, fat: 0.5, carbs: 55 },
    { id: 4, name: 'サーモン（100g）', protein: 20, fat: 10, carbs: 0 },
    { id: 5, name: 'ブロッコリー（100g）', protein: 4, fat: 0.5, carbs: 5 },
    { id: 6, name: 'アボカド（1個）', protein: 2, fat: 15, carbs: 9 },
    { id: 7, name: 'バナナ（1本）', protein: 1, fat: 0.2, carbs: 27 },
    { id: 8, name: 'プロテインパウダー（1スクープ）', protein: 25, fat: 1, carbs: 3 }
  ]
  return c.json(foods)
})

// デフォルトルート
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PFCバランス計算アプリ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-6xl">
            <!-- ヘッダー -->
            <header class="text-center mb-8">
                <h1 class="text-4xl font-bold text-indigo-800 mb-2">
                    <i class="fas fa-utensils mr-2"></i>
                    PFCバランス計算アプリ
                </h1>
                <p class="text-gray-600">あなたの理想的な栄養バランスを計算します</p>
            </header>

            <!-- 入力フォーム -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-calculator mr-2"></i>
                    基本情報入力
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">
                            <i class="fas fa-weight mr-1"></i>体重 (kg)
                        </label>
                        <input type="number" id="weight" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="例: 70" min="1" max="300">
                    </div>

                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">
                            <i class="fas fa-venus-mars mr-1"></i>性別
                        </label>
                        <select id="gender" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                            <option value="male">男性</option>
                            <option value="female">女性</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">
                            <i class="fas fa-running mr-1"></i>活動レベル
                        </label>
                        <select id="activityLevel" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                            <option value="sedentary">ほとんど運動しない</option>
                            <option value="light">軽い運動（週1-2回）</option>
                            <option value="moderate">中程度の運動（週3-5回）</option>
                            <option value="active">激しい運動（週6-7回）</option>
                            <option value="veryActive">非常に激しい運動</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-gray-700 font-semibold mb-2">
                            <i class="fas fa-bullseye mr-1"></i>目標
                        </label>
                        <select id="goal" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                            <option value="maintain">体重維持</option>
                            <option value="lose">減量</option>
                            <option value="gain">増量</option>
                        </select>
                    </div>
                </div>

                <button onclick="calculatePFC()" class="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition duration-200 shadow-md">
                    <i class="fas fa-chart-pie mr-2"></i>計算する
                </button>
            </div>

            <!-- 結果表示エリア -->
            <div id="results" class="hidden">
                <!-- 代謝情報 -->
                <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-fire mr-2"></i>
                        代謝情報
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <p class="text-gray-600 text-sm">基礎代謝量 (BMR)</p>
                            <p class="text-3xl font-bold text-blue-600" id="bmr">-</p>
                            <p class="text-gray-500 text-sm">kcal/日</p>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <p class="text-gray-600 text-sm">総消費カロリー (TDEE)</p>
                            <p class="text-3xl font-bold text-green-600" id="tdee">-</p>
                            <p class="text-gray-500 text-sm">kcal/日</p>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <p class="text-gray-600 text-sm">目標カロリー</p>
                            <p class="text-3xl font-bold text-purple-600" id="targetCalories">-</p>
                            <p class="text-gray-500 text-sm">kcal/日</p>
                        </div>
                    </div>
                </div>

                <!-- PFCバランス -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <!-- 円グラフ -->
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-chart-pie mr-2"></i>
                            PFCバランス
                        </h2>
                        <canvas id="pfcChart"></canvas>
                    </div>

                    <!-- 詳細情報 -->
                    <div class="bg-white rounded-xl shadow-lg p-6">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">
                            <i class="fas fa-list-ul mr-2"></i>
                            詳細
                        </h2>
                        <div class="space-y-4">
                            <!-- タンパク質 -->
                            <div class="border-l-4 border-red-500 pl-4">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="font-bold text-red-600">タンパク質 (Protein)</span>
                                    <span class="text-gray-600" id="proteinPercent">-</span>
                                </div>
                                <div class="text-2xl font-bold text-gray-800" id="proteinGrams">-</div>
                                <div class="text-sm text-gray-500" id="proteinCalories">-</div>
                            </div>

                            <!-- 脂質 -->
                            <div class="border-l-4 border-yellow-500 pl-4">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="font-bold text-yellow-600">脂質 (Fat)</span>
                                    <span class="text-gray-600" id="fatPercent">-</span>
                                </div>
                                <div class="text-2xl font-bold text-gray-800" id="fatGrams">-</div>
                                <div class="text-sm text-gray-500" id="fatCalories">-</div>
                            </div>

                            <!-- 炭水化物 -->
                            <div class="border-l-4 border-green-500 pl-4">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="font-bold text-green-600">炭水化物 (Carbs)</span>
                                    <span class="text-gray-600" id="carbsPercent">-</span>
                                </div>
                                <div class="text-2xl font-bold text-gray-800" id="carbsGrams">-</div>
                                <div class="text-sm text-gray-500" id="carbsCalories">-</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 食品例 -->
                <div class="bg-white rounded-xl shadow-lg p-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-apple-alt mr-2"></i>
                        参考：食品のPFC値
                    </h2>
                    <div id="foodsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <!-- 動的に生成 -->
                    </div>
                </div>
            </div>

            <!-- フッター -->
            <footer class="text-center mt-8 text-gray-600">
                <p class="text-sm">
                    <i class="fas fa-info-circle mr-1"></i>
                    ※計算結果は目安です。個人の体質や健康状態により異なります。
                </p>
            </footer>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
