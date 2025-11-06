---
layout: snipdump
title: "Shuffle Array (Fisher-Yates)"
date: 2025-11-05
tags: [javascript, array, shuffle]
categories: [code]
language: JavaScript
---

# Fisher-Yates Array Shuffle

A proper way to shuffle an array in JavaScript:

```javascript
function shuffleArray(array) {
  const arr = [...array]; // Create a copy
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Usage
const numbers = [1, 2, 3, 4, 5];
const shuffled = shuffleArray(numbers);
console.log(shuffled);
```

## Why This Works

The Fisher-Yates algorithm ensures each permutation has an equal probability of occurring. Simple `sort(() => Math.random() - 0.5)` is biased and shouldn't be used.
