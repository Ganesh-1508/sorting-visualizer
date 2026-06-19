const svg = d3.select('#svg');
const WIDTH = 800;
const HEIGHT = 400;
const delay = 100;
let arr = [];
let comparisons = 0;
let swaps = 0;
let startTime = 0;
let isSorting = false;
let isPaused = false;
let isManualMode = false;
let animationId = null;
let sortSteps = [];
let stepExplanations = [];
let pointer = null;
let currentStep = -1;

// Initialize SVG with gradients
function initSvg() {
    const defs = svg.append('defs');
    defs.append('linearGradient')
        .attr('id', 'barGradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%')
        .selectAll('stop')
        .data([
            {offset: '0%', color: '#1e40af', opacity: '1'},
            {offset: '100%', color: '#06b6d4', opacity: '1'}
        ])
        .enter()
        .append('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color)
        .attr('stop-opacity', d => d.opacity);
    defs.append('linearGradient')
        .attr('id', 'highlightGradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%')
        .selectAll('stop')
        .data([
            {offset: '0%', color: '#dc2626', opacity: '1'},
            {offset: '100%', color: '#f97316', opacity: '1'}
        ])
        .enter()
        .append('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color)
        .attr('stop-opacity', d => d.opacity);
}

// Initialize pointer
function initPointer() {
    pointer = svg.append('polygon')
        .attr('points', '0,0 20,10 0,20')
        .attr('fill', 'green')
        .attr('transform', 'translate(0, 0)')
        .style('opacity', 0);
}

// Show step toast
function showStepToast(stepInfo) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    // Create step description
    let description = '';
    if (stepInfo.action === 'compare') {
        description = `Comparing indices ${stepInfo.indices.join(' and ')}: ${stepInfo.values[0]} vs ${stepInfo.values[1]}`;
    } else if (stepInfo.action === 'swap') {
        description = `Swapping indices ${stepInfo.indices.join(' and ')}: ${stepInfo.values[0]} ↔ ${stepInfo.values[1]}`;
    } else if (stepInfo.action === 'merge') {
        description = `Merging at indices ${stepInfo.indices.join(' and ')}`;
    } else if (stepInfo.action === 'pivot') {
        description = `Comparing index ${stepInfo.indices[0]} with pivot ${stepInfo.values[1]} at index ${stepInfo.indices[1]}`;
    }
    const arrayState = stepInfo.arrayState.map((val, i) => stepInfo.indices.includes(i) ? `*${val}*` : val).join(', ');
    const toastText = `Step ${currentStep + 1}\n${description}\nArray: [${arrayState}]`;
    // Create toast HTML
    const toastHtml = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="true" data-bs-delay="3000">
            <div class="toast-header">
                <strong class="me-auto">Step Details</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                <pre>${toastText}</pre>
            </div>
        </div>
    `;
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        console.warn("Toast container not found in DOM. Ensure <div id='toastContainer'> exists in index.html.");
        return; // Skip toast display but don't throw error
    }
    toastContainer.innerHTML = toastHtml;
    const toastElement = toastContainer.querySelector('.toast');
    if (toastElement) {
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    } else {
        console.warn("Failed to create toast element.");
    }
}

// Generate final algorithm explanation
function getAlgorithmExplanation(algo) {
    const explanations = {
        bubble: `
            <h6>Bubble Sort</h6>
            <p>Bubble Sort repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The process continues until no swaps are needed, indicating the array is sorted.</p>
            <ul>
                <li><strong>Time Complexity:</strong> O(n²) worst/average, O(n) best (nearly sorted).</li>
                <li><strong>Space Complexity:</strong> O(1).</li>
                <li><strong>Key Points:</strong> Simple but inefficient for large datasets. Stable sort.</li>
            </ul>
        `,
        selection: `
            <h6>Selection Sort</h6>
            <p>Selection Sort divides the array into sorted and unsorted portions. In each iteration, it finds the minimum element in the unsorted portion and swaps it with the first unsorted element.</p>
            <ul>
                <li><strong>Time Complexity:</strong> O(n²) for all cases.</li>
                <li><strong>Space Complexity:</strong> O(1).</li>
                <li><strong>Key Points:</strong> In-place but not stable. Performs well for small arrays.</li>
            </ul>
        `,
        insertion: `
            <h6>Insertion Sort</h6>
            <p>Insertion Sort builds the sorted array one element at a time by taking an element from the unsorted portion and inserting it into the correct position in the sorted portion.</p>
            <ul>
                <li><strong>Time Complexity:</strong> O(n²) worst/average, O(n) best (nearly sorted).</li>
                <li><strong>Space Complexity:</strong> O(1).</li>
                <li><strong>Key Points:</strong> Stable and efficient for small or nearly sorted arrays.</li>
            </ul>
        `,
        merge: `
            <h6>Merge Sort</h6>
            <p>Merge Sort uses a divide-and-conquer approach, recursively splitting the array into halves, sorting each half, and merging them back together in sorted order.</p>
            <ul>
                <li><strong>Time Complexity:</strong> O(n log n) for all cases.</li>
                <li><strong>Space Complexity:</strong> O(n).</li>
                <li><strong>Key Points:</strong> Stable and efficient for large datasets but requires extra space.</li>
            </ul>
        `,
        quick: `
            <h6>Quick Sort</h6>
            <p>Quick Sort selects a pivot element, partitions the array around it (smaller elements before, larger after), and recursively sorts the sub-arrays.</p>
            <ul>
                <li><strong>Time Complexity:</strong> O(n log n) average, O(n²) worst (rare).</li>
                <li><strong>Space Complexity:</strong> O(log n) average.</li>
                <li><strong>Key Points:</strong> In-place, not stable, but very efficient for large datasets.</li>
            </ul>
        `
    };
    return explanations[algo] || '<p>No explanation available for the selected algorithm.</p>';
}

// Generate array from user input
function generateArray() {
    const customInput = document.getElementById('customArray').value.trim();
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.style.display = 'none';
    if (!customInput) {
        errorMsg.textContent = 'Please enter a comma-separated array (e.g., 10,5,3,8).';
        errorMsg.style.display = 'block';
        return;
    }
    const inputArr = customInput.split(',').map(num => parseInt(num.trim()));
    if (inputArr.length < 5 || inputArr.length > 50) {
        errorMsg.textContent = 'Array size must be between 5 and 50 elements.';
        errorMsg.style.display = 'block';
        return;
    }
    if (inputArr.some(isNaN) || inputArr.some(num => num < 1 || num > 1000)) {
        errorMsg.textContent = 'All values must be numbers between 1 and 1000.';
        errorMsg.style.display = 'block';
        return;
    }
    arr = inputArr;
    drawArray();
    resetMetrics();
    sortSteps = [];
    stepExplanations = [];
    currentStep = -1;
    isManualMode = false;
    document.getElementById('replayBtn').disabled = true;
    document.getElementById('nextBtn').disabled = true;
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('manualBtn').disabled = false;
    const sidebar = bootstrap.Offcanvas.getInstance(document.getElementById('explanationSidebar'));
    if (sidebar) sidebar.hide();
    if (!pointer) initPointer();

    // ====== NEW: update Metrics box (Before/After) ======
    // Show the array before sorting and clear after array display
    document.getElementById('beforeArray').textContent = arr.join(', ');
    document.getElementById('afterArray').textContent = '-';
}

// Draw array with bars and text labels
function drawArray(highlightIndices = [], action = '', indices = [], values = []) {
    const barWidth = WIDTH / arr.length;
    svg.selectAll('rect').data(arr)
        .join('rect')
        .attr('x', (d, i) => i * barWidth)
        .attr('y', d => HEIGHT - d * 2.5)
        .attr('width', barWidth - 1)
        .attr('height', d => d * 2.5)
        .attr('fill', (d, i) => highlightIndices.includes(i) ? 'url(#highlightGradient)' : 'url(#barGradient)')
        .attr('rx', 4)
        .attr('ry', 4)
        .transition()
        .duration(isManualMode ? 0 : delay)
        .ease(d3.easeBounceOut)
        .attr('y', d => HEIGHT - d * 2.5)
        .attr('height', d => d * 2.5);
    svg.selectAll('text').data(arr)
        .join('text')
        .attr('x', (d, i) => i * barWidth + barWidth / 2)
        .attr('y', d => HEIGHT - d * 2.5 - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'black')
        .attr('font-size', Math.max(10, barWidth / 4))
        .text(d => d)
        .transition()
        .duration(isManualMode ? 0 : delay)
        .ease(d3.easeBounceOut)
        .attr('y', d => HEIGHT - d * 2.5 - 5);
    if (!isManualMode) {
        sortSteps.push({arrSnapshot: [...arr], highlightIndices: [...highlightIndices]});
        stepExplanations.push({action, indices, values, arrayState: [...arr]});
        currentStep = sortSteps.length - 1;
    }
}

// Animated swap with scale and glow
async function animatedSwap(idx1, idx2) {
    const barWidth = WIDTH / arr.length;
    svg.append('rect')
        .attr('x', idx1 * barWidth)
        .attr('y', HEIGHT - arr[idx1] * 2.5)
        .attr('width', barWidth - 1)
        .attr('height', arr[idx1] * 2.5)
        .attr('fill', 'rgba(255, 255, 0, 0.5)')
        .attr('filter', 'drop-shadow(0 0 10px yellow)')
        .attr('rx', 4)
        .attr('ry', 4)
        .transition()
        .duration(delay * 2)
        .attr('transform', 'scale(1.1)')
        .attr('opacity', 0)
        .remove();
    svg.append('rect')
        .attr('x', idx2 * barWidth)
        .attr('y', HEIGHT - arr[idx2] * 2.5)
        .attr('width', barWidth - 1)
        .attr('height', arr[idx2] * 2.5)
        .attr('fill', 'rgba(255, 255, 0, 0.5)')
        .attr('filter', 'drop-shadow(0 0 10px yellow)')
        .attr('rx', 4)
        .attr('ry', 4)
        .transition()
        .duration(delay * 2)
        .attr('transform', 'scale(1.1)')
        .attr('opacity', 0)
        .remove();
    const temp = arr[idx1];
    arr[idx1] = arr[idx2];
    arr[idx2] = temp;
    swaps++;
    svg.selectAll('rect').data(arr)
        .transition()
        .duration(isManualMode ? 0 : delay * 2)
        .ease(d3.easeBounceOut)
        .attr('x', (d, i) => i * barWidth)
        .attr('y', d => HEIGHT - d * 2.5)
        .attr('height', d => d * 2.5)
        .attr('transform', 'scale(1.05)')
        .transition()
        .duration(delay / 2)
        .attr('transform', 'scale(1)');
    svg.selectAll('text').data(arr)
        .transition()
        .duration(isManualMode ? 0 : delay * 2)
        .ease(d3.easeBounceOut)
        .attr('x', (d, i) => i * barWidth + barWidth / 2)
        .attr('y', d => HEIGHT - d * 2.5 - 5)
        .text(d => d);
    if (!isManualMode) {
        sortSteps.push({arrSnapshot: [...arr], highlightIndices: [idx1, idx2]});
        stepExplanations.push({action: 'swap', indices: [idx1, idx2], values: [temp, arr[idx1]], arrayState: [...arr]});
        currentStep = sortSteps.length - 1;
        await sleep(delay * 2);
    }
    updateMetrics();
}

// Non-animated swap for manual mode step generation
function manualSwap(idx1, idx2) {
    const temp = arr[idx1];
    arr[idx1] = arr[idx2];
    arr[idx2] = temp;
    swaps++;
    sortSteps.push({arrSnapshot: [...arr], highlightIndices: [idx1, idx2]});
    stepExplanations.push({action: 'swap', indices: [idx1, idx2], values: [temp, arr[idx1]], arrayState: [...arr]});
    updateMetrics();
}

// Animate pointer
async function animatePointer(idx) {
    if (isManualMode) return;
    const barWidth = WIDTH / arr.length;
    pointer.style('opacity', 1)
        .transition()
        .duration(delay / 2)
        .attr('transform', `translate(${idx * barWidth + barWidth / 2 - 10}, ${HEIGHT - 30}) scale(1.5)`)
        .transition()
        .duration(delay / 2)
        .attr('transform', `translate(${idx * barWidth + barWidth / 2 - 10}, ${HEIGHT - 20}) scale(1)`);
}

// Update metrics
function updateMetrics() {
    const time = Date.now() - startTime;
    document.getElementById('metrics').textContent = `Comparisons: ${comparisons} | Swaps: ${swaps} | Time: ${time}ms`;
}

// Reset metrics
function resetMetrics() {
    comparisons = 0;
    swaps = 0;
    startTime = Date.now();
    updateMetrics();
}

// Sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Manual step navigation
function nextStep() {
    if (sortSteps.length === 0) {
        console.log("No steps available to navigate.");
        return;
    }
    if (currentStep < sortSteps.length - 1) {
        currentStep++;
        arr = [...sortSteps[currentStep].arrSnapshot];
        drawArray(sortSteps[currentStep].highlightIndices);
        showStepToast(stepExplanations[currentStep]);
        updateMetrics();
        if (currentStep === sortSteps.length - 1) {
            finishSort();
        }
    }
    document.getElementById('prevBtn').disabled = currentStep <= 0;
    document.getElementById('nextBtn').disabled = currentStep >= sortSteps.length - 1;
}

function prevStep() {
    if (sortSteps.length === 0) {
        console.log("No steps available to navigate.");
        return;
    }
    if (currentStep > 0) {
        currentStep--;
        arr = [...sortSteps[currentStep].arrSnapshot];
        drawArray(sortSteps[currentStep].highlightIndices);
        showStepToast(stepExplanations[currentStep]);
        updateMetrics();
    }
    document.getElementById('prevBtn').disabled = currentStep <= 0;
    document.getElementById('nextBtn').disabled = currentStep >= sortSteps.length - 1;
}

// Sorting Algorithms
async function bubbleSort(generateSteps = false) {
    console.log("Bubble Sort started", generateSteps ? "(generating steps)" : "");
    for (let i = 0; i < arr.length; i++) {
        let swapped = false;
        for (let j = 0; j < arr.length - i - 1; j++) {
            if (!isSorting && !generateSteps) {
                console.log("Sorting stopped");
                return;
            }
            if (isPaused && !generateSteps) await waitForResume();
            comparisons++;
            if (!isManualMode || generateSteps) {
                if (!generateSteps) {
                    await animatePointer(j);
                    drawArray([j, j+1], 'compare', [j, j+1], [arr[j], arr[j+1]]);
                    await sleep(delay);
                    playSound(600, 0.05);
                } else {
                    sortSteps.push({arrSnapshot: [...arr], highlightIndices: [j, j+1]});
                    stepExplanations.push({action: 'compare', indices: [j, j+1], values: [arr[j], arr[j+1]], arrayState: [...arr]});
                }
            } else {
                drawArray([j, j+1]);
            }
            if (arr[j] > arr[j+1]) {
                swapped = true;
                if (!isManualMode || generateSteps) {
                    if (!generateSteps) {
                        await animatedSwap(j, j+1);
                        playSound(400, 0.1);
                    } else {
                        manualSwap(j, j+1);
                    }
                } else {
                    const temp = arr[j];
                    arr[j] = arr[j+1];
                    arr[j+1] = temp;
                    swaps++;
                    drawArray([j, j+1], 'swap', [j, j+1], [arr[j+1], arr[j]], [...arr]);
                    updateMetrics();
                }
            }
        }
        if (!swapped) break;
    }
    console.log("Bubble Sort completed");
    if (!isManualMode && !generateSteps) finishSort();
}

async function selectionSort(generateSteps = false) {
    console.log("Selection Sort started", generateSteps ? "(generating steps)" : "");
    for (let i = 0; i < arr.length; i++) {
        let minIdx = i;
        for (let j = i + 1; j < arr.length; j++) {
            if (!isSorting && !generateSteps) return;
            if (isPaused && !generateSteps) await waitForResume();
            comparisons++;
            if (!isManualMode || generateSteps) {
                if (!generateSteps) {
                    await animatePointer(j);
                    drawArray([minIdx, j], 'compare', [minIdx, j], [arr[minIdx], arr[j]]);
                    await sleep(delay);
                    playSound(600, 0.05);
                } else {
                    sortSteps.push({arrSnapshot: [...arr], highlightIndices: [minIdx, j]});
                    stepExplanations.push({action: 'compare', indices: [minIdx, j], values: [arr[minIdx], arr[j]], arrayState: [...arr]});
                }
            } else {
                drawArray([minIdx, j]);
            }
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        if (minIdx !== i) {
            if (!isManualMode || generateSteps) {
                if (!generateSteps) {
                    await animatedSwap(i, minIdx);
                    playSound(400, 0.1);
                } else {
                    manualSwap(i, minIdx);
                }
            } else {
                const temp = arr[i];
                arr[i] = arr[minIdx];
                arr[minIdx] = temp;
                swaps++;
                drawArray([i, minIdx], 'swap', [i, minIdx], [arr[i], arr[minIdx]], [...arr]);
                updateMetrics();
            }
        }
    }
    console.log("Selection Sort completed");
    if (!isManualMode && !generateSteps) finishSort();
}

async function insertionSort(generateSteps = false) {
    console.log("Insertion Sort started", generateSteps ? "(generating steps)" : "");
    for (let i = 1; i < arr.length; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            if (!isSorting && !generateSteps) return;
            if (isPaused && !generateSteps) await waitForResume();
            comparisons++;
            if (!isManualMode || generateSteps) {
                if (!generateSteps) {
                    await animatePointer(j);
                    drawArray([j, j+1], 'compare', [j, j+1], [arr[j], arr[j+1]]);
                    await sleep(delay);
                    playSound(600, 0.05);
                } else {
                    sortSteps.push({arrSnapshot: [...arr], highlightIndices: [j, j+1]});
                    stepExplanations.push({action: 'compare', indices: [j, j+1], values: [arr[j], arr[j+1]], arrayState: [...arr]});
                }
            } else {
                drawArray([j, j+1]);
            }
            arr[j + 1] = arr[j];
            j--;
            swaps++;
            updateMetrics();
            if (!isManualMode || generateSteps) {
                if (!generateSteps) {
                    drawArray([], 'swap', [j+1, j+2], [arr[j+1], arr[j+2]], [...arr]);
                } else {
                    sortSteps.push({arrSnapshot: [...arr], highlightIndices: []});
                    stepExplanations.push({action: 'swap', indices: [j+1, j+2], values: [arr[j+1], arr[j+2]], arrayState: [...arr]});
                }
            }
        }
        arr[j + 1] = key;
        if (isManualMode && !generateSteps) {
            drawArray([], 'swap', [j+1, i], [arr[j+1], key], [...arr]);
        } else if (generateSteps) {
            sortSteps.push({arrSnapshot: [...arr], highlightIndices: []});
            stepExplanations.push({action: 'swap', indices: [j+1, i], values: [arr[j+1], key], arrayState: [...arr]});
        }
    }
    console.log("Insertion Sort completed");
    if (!isManualMode && !generateSteps) finishSort();
}

async function mergeSort(start = 0, end = arr.length - 1, generateSteps = false) {
    if (start >= end) return;
    const mid = Math.floor((start + end) / 2);
    await mergeSort(start, mid, generateSteps);
    await mergeSort(mid + 1, end, generateSteps);
    await merge(start, mid, end, generateSteps);
    if (start === 0 && end === arr.length - 1 && !isManualMode && !generateSteps) finishSort();
}

async function merge(start, mid, end, generateSteps = false) {
    const temp = [];
    let i = start, j = mid + 1;
    while (i <= mid && j <= end) {
        if (!isSorting && !generateSteps) return;
        if (isPaused && !generateSteps) await waitForResume();
        comparisons++;
        if (!isManualMode || generateSteps) {
            if (!generateSteps) {
                await animatePointer(i);
                drawArray([i, j], 'merge', [i, j], [arr[i], arr[j]]);
                await sleep(delay);
                playSound(600, 0.05);
            } else {
                sortSteps.push({arrSnapshot: [...arr], highlightIndices: [i, j]});
                stepExplanations.push({action: 'merge', indices: [i, j], values: [arr[i], arr[j]], arrayState: [...arr]});
            }
        } else {
            drawArray([i, j]);
        }
        if (arr[i] <= arr[j]) {
            temp.push(arr[i++]);
        } else {
            temp.push(arr[j++]);
            swaps++;
            if (!generateSteps && !isManualMode) playSound(400, 0.1);
        }
        updateMetrics();
    }
    while (i <= mid) temp.push(arr[i++]);
    while (j <= end) temp.push(arr[j++]);
    for (let k = start; k <= end; k++) arr[k] = temp[k - start];
    if (!isManualMode || generateSteps) {
        if (!generateSteps) {
            drawArray();
        } else {
            sortSteps.push({arrSnapshot: [...arr], highlightIndices: []});
            stepExplanations.push({action: 'merge', indices: [], values: [], arrayState: [...arr]});
        }
    }
}

async function quickSort(start = 0, end = arr.length - 1, generateSteps = false) {
    if (start >= end) return;
    const pivot = arr[end];
    let partitionIdx = start;
    for (let i = start; i < end; i++) {
        if (!isSorting && !generateSteps) return;
        if (isPaused && !generateSteps) await waitForResume();
        comparisons++;
        if (!isManualMode || generateSteps) {
            if (!generateSteps) {
                await animatePointer(i);
                drawArray([i, end], 'pivot', [i, end], [arr[i], pivot]);
                await sleep(delay);
                playSound(600, 0.05);
            } else {
                sortSteps.push({arrSnapshot: [...arr], highlightIndices: [i, end]});
                stepExplanations.push({action: 'pivot', indices: [i, end], values: [arr[i], pivot], arrayState: [...arr]});
            }
        } else {
            drawArray([i, end]);
        }
        if (arr[i] < pivot) {
            if (!isManualMode || generateSteps) {
                if (!generateSteps) {
                    await animatedSwap(i, partitionIdx);
                    playSound(400, 0.1);
                } else {
                    manualSwap(i, partitionIdx);
                }
            } else {
                const temp = arr[i];
                arr[i] = arr[partitionIdx];
                arr[partitionIdx] = temp;
                swaps++;
                drawArray([i, partitionIdx], 'swap', [i, partitionIdx], [arr[i], arr[partitionIdx]], [...arr]);
                updateMetrics();
            }
            partitionIdx++;
        }
    }
    if (!isManualMode || generateSteps) {
        if (!generateSteps) {
            await animatedSwap(end, partitionIdx);
            playSound(400, 0.1);
        } else {
            manualSwap(end, partitionIdx);
        }
    } else {
        const temp = arr[end];
        arr[end] = arr[partitionIdx];
        arr[partitionIdx] = temp;
        swaps++;
        drawArray([end, partitionIdx], 'swap', [end, partitionIdx], [arr[end], arr[partitionIdx]], [...arr]);
        updateMetrics();
    }
    await quickSort(start, partitionIdx - 1, generateSteps);
    await quickSort(partitionIdx + 1, end, generateSteps);
    if (start === 0 && end === arr.length - 1 && !isManualMode && !generateSteps) finishSort();
}

// Start sorting (automatic mode)
async function startSort() {
    if (isSorting) {
        console.log("Sorting already in progress, please reset or wait.");
        return;
    }
    if (!arr.length) {
        document.getElementById('errorMsg').textContent = 'Please generate a valid array first.';
        document.getElementById('errorMsg').style.display = 'block';
        return;
    }
    console.log("Starting sort with algorithm:", document.getElementById('algorithm').value);
    isSorting = true;
    isPaused = false;
    isManualMode = false;
    // ====== NEW: ensure Before display is up-to-date and After cleared when sorting starts ======
    document.getElementById('beforeArray').textContent = arr.join(', ');
    document.getElementById('afterArray').textContent = '-';

    resetMetrics();
    sortSteps = [];
    stepExplanations = [];
    currentStep = -1;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('nextBtn').disabled = true;
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('manualBtn').disabled = true;
    const sidebar = bootstrap.Offcanvas.getInstance(document.getElementById('explanationSidebar'));
    if (sidebar) sidebar.hide();
    const algo = document.getElementById('algorithm').value;
    try {
        if (algo === 'bubble') await bubbleSort();
        else if (algo === 'selection') await selectionSort();
        else if (algo === 'insertion') await insertionSort();
        else if (algo === 'merge') await mergeSort();
        else if (algo === 'quick') await quickSort();
    } catch (error) {
        console.error("Error during sorting:", error);
        isSorting = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('manualBtn').disabled = false;
    }
}

// Start manual mode
async function startManualSort() {
    if (isSorting) {
        console.log("Sorting already in progress, please reset or wait.");
        return;
    }
    if (!arr.length) {
        document.getElementById('errorMsg').textContent = 'Please generate a valid array first.';
        document.getElementById('errorMsg').style.display = 'block';
        return;
    }
    console.log("Starting manual sort with algorithm:", document.getElementById('algorithm').value);
    isSorting = true;
    isPaused = false;
    isManualMode = true;
    resetMetrics();
    sortSteps = [];
    stepExplanations = [];
    currentStep = -1;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('manualBtn').disabled = true;
    const sidebar = bootstrap.Offcanvas.getInstance(document.getElementById('explanationSidebar'));
    if (sidebar) sidebar.hide();
    
    // Store original array and generate steps
    const originalArr = [...arr];

    // ====== NEW: set Before Sorting in metrics for manual mode start ======
    document.getElementById('beforeArray').textContent = originalArr.join(', ');
    document.getElementById('afterArray').textContent = '-';

    const algo = document.getElementById('algorithm').value;
    try {
        // Generate all steps synchronously
        if (algo === 'bubble') await bubbleSort(true);
        else if (algo === 'selection') await selectionSort(true);
        else if (algo === 'insertion') await insertionSort(true);
        else if (algo === 'merge') await mergeSort(0, arr.length - 1, true);
        else if (algo === 'quick') await quickSort(0, arr.length - 1, true);
        
        // Update button states after step generation
        document.getElementById('nextBtn').disabled = sortSteps.length === 0;
        document.getElementById('prevBtn').disabled = true;
        
        // Restore original array and show first step
        arr = [...originalArr];
        currentStep = -1;
        if (sortSteps.length > 0) {
            nextStep(); // Show first step
        } else {
            console.log("No steps generated for manual mode.");
            isSorting = false;
            document.getElementById('startBtn').disabled = false;
            document.getElementById('nextBtn').disabled = true;
            document.getElementById('prevBtn').disabled = true;
            document.getElementById('manualBtn').disabled = false;
        }
    } catch (error) {
        console.error("Error during manual sorting:", error);
        isSorting = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('nextBtn').disabled = true;
        document.getElementById('prevBtn').disabled = true;
        document.getElementById('manualBtn').disabled = false;
    }
}

// Pause/Resume/Wait
function pauseSort() {
    isPaused = true;
    document.getElementById('pauseBtn').textContent = 'Resume';
    document.getElementById('pauseBtn').onclick = resumeSort;
    document.getElementById('nextBtn').disabled = false;
    document.getElementById('prevBtn').disabled = currentStep <= 0;
}

function resumeSort() {
    isPaused = false;
    isManualMode = false;
    document.getElementById('pauseBtn').textContent = 'Pause';
    document.getElementById('pauseBtn').onclick = pauseSort;
    document.getElementById('nextBtn').disabled = true;
    document.getElementById('prevBtn').disabled = true;
}

function waitForResume() {
    return new Promise(resolve => {
        animationId = setInterval(() => {
            if (!isSorting) {
                clearInterval(animationId);
                resolve();
            }
            if (!isPaused) {
                clearInterval(animationId);
                resolve();
            }
        }, 100);
    });
}

// Reset sort
function resetSort() {
    isSorting = false;
    isPaused = false;
    isManualMode = false;
    clearInterval(animationId);
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('pauseBtn').textContent = 'Pause';
    document.getElementById('pauseBtn').onclick = pauseSort;
    document.getElementById('nextBtn').disabled = true;
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('manualBtn').disabled = false;
    document.getElementById('customArray').value = '';
    document.getElementById('errorMsg').style.display = 'none';
    arr = [];
    svg.selectAll('rect').remove();
    svg.selectAll('text').remove();
    resetMetrics();
    sortSteps = [];
    stepExplanations = [];
    currentStep = -1;
    const sidebar = bootstrap.Offcanvas.getInstance(document.getElementById('explanationSidebar'));
    if (sidebar) sidebar.hide();
    document.getElementById('explanationContent').innerHTML = '';
    // Clear toasts
    const toastContainer = document.getElementById('toastContainer');
    if (toastContainer) toastContainer.innerHTML = '';

    // ====== NEW: clear Before/After displays ======
    document.getElementById('beforeArray').textContent = '-';
    document.getElementById('afterArray').textContent = '-';
}

// Finish sort
function finishSort() {
    console.log("Finishing sort");
    isSorting = false;
    isPaused = false;
    isManualMode = false;
    clearInterval(animationId);
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('replayBtn').disabled = sortSteps.length === 0;
    document.getElementById('nextBtn').disabled = true;
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('manualBtn').disabled = false;
    pointer.style('opacity', 0);
    svg.selectAll('rect').data(arr)
        .transition()
        .duration(500)
        .attr('fill', (d, i) => `hsl(${i * 360 / arr.length}, 100%, 50%)`);
    svg.selectAll('text').data(arr)
        .transition()
        .duration(500)
        .attr('fill', 'black');

    // ====== NEW: update After Sorting in metrics when finishing ======
    document.getElementById('afterArray').textContent = arr.join(', ');

    updateMetrics();
    celebrate();
    // Show final algorithm explanation in sidebar
    const algo = document.getElementById('algorithm').value;
    document.getElementById('explanationContent').innerHTML = getAlgorithmExplanation(algo);
    const sidebar = new bootstrap.Offcanvas(document.getElementById('explanationSidebar'));
    sidebar.show();
}

// Enhanced celebrate
function celebrate() {
    for (let i = 0; i < 100; i++) {
        const circle = svg.append('circle')
            .attr('cx', Math.random() * WIDTH)
            .attr('cy', 0 - Math.random() * 100)
            .attr('r', Math.random() * 5 + 2)
            .attr('fill', `hsl(${Math.random() * 360}, 100%, 50%)`)
            .transition()
            .duration(2000 + Math.random() * 1000)
            .ease(d3.easeQuadIn)
            .attr('cy', HEIGHT + 50)
            .remove();
    }
}

// Replay sort
async function replaySort() {
    document.getElementById('replayBtn').disabled = true;
    for (let i = 0; i < sortSteps.length; i++) {
        arr = sortSteps[i].arrSnapshot;
        drawArray(sortSteps[i].highlightIndices);
        showStepToast(stepExplanations[i]);
        await sleep(delay / 4);
    }
    document.getElementById('replayBtn').disabled = false;
    finishSort();
}

// Audio context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(frequency = 440, duration = 0.1) {
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    setTimeout(() => oscillator.stop(), duration * 1000);
}

// Initialize SVG
initSvg();
