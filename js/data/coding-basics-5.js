registerSimple("coding-basics", {
"Count vowels, words and characters in a string":
`Go through the string once, character by character. If it is one of a, e, i, o, u (in either case), add one to the vowel count. Count words by noticing where a word starts: a letter that comes after a space or at the very beginning. Remember to handle an empty string and multiple spaces between words.`,

"Print the common star and number patterns":
`Patterns are just nested loops. The outer loop goes row by row; the inner loops print first the spaces, then the stars or numbers for that row. The trick is to write down, for row <code>i</code>, how many spaces and how many symbols it needs (for a pyramid: <code>n - i</code> spaces and <code>2i - 1</code> stars), and then loop exactly that many times.`,

"The string questions every first round asks — and the Java details behind them":
`Common ones: reverse a string, check a palindrome, count characters, find duplicates and check anagrams. Java details they test: strings cannot be changed after creation (they are immutable), so use <code>StringBuilder</code> to build text in loops; compare strings with <code>equals()</code>, not <code>==</code>; and <code>charAt(i)</code> reads one character.`,

"Number problems: primes, factorials, Fibonacci, GCD and integer overflow":
`<b>Prime</b>: check divisors only up to the square root. <b>Factorial</b>: multiply 1 × 2 × … × n, but it grows so fast that it overflows <code>int</code> at 13! and <code>long</code> at 21!. <b>Fibonacci</b>: add the previous two numbers in a loop. <b>GCD</b>: keep replacing (a, b) with (b, a % b) until b is 0. Watch for numbers getting too big for their type.`,

"Check if two strings are anagrams, then group a list of words into anagram groups":
`Two words are anagrams if they contain the same letters the same number of times. To group many words, give each word a "signature" that is the same for all its anagrams, such as its letters sorted ("eat", "tea" and "ate" all become "aet"). Use that signature as a key in a <code>HashMap</code> and add each word to the list for its key.`,

"Reverse an integer safely, and check for Armstrong and perfect numbers":
`All three use the same loop: <code>n % 10</code> gives the last digit and <code>n / 10</code> removes it. To <b>reverse</b>, build up <code>rev = rev * 10 + digit</code>, and check for overflow first. An <b>Armstrong</b> number equals the sum of its digits each raised to the number of digits (153 = 1³ + 5³ + 3³). A <b>perfect</b> number equals the sum of its divisors (6 = 1 + 2 + 3).`,

"Reverse a string without using any built-in reverse function":
`Turn the string into a character array and use two positions: one at the start and one at the end. Swap those two characters, move both positions towards the middle, and repeat until they meet. Each character is moved once, so it takes O(n) time and needs no extra copy.`,

"Check whether a string or number is a palindrome":
`A palindrome reads the same forwards and backwards, like "madam" or 121. For a string, compare the first and last characters, then move inwards; if any pair differs, it is not a palindrome. For a number, reverse only its second half and compare it with the first half, which avoids overflow and needs no string conversion.`,

"Find the factorial and the nth Fibonacci number — iteratively and recursively":
`<b>Factorial</b>: n! = n × (n-1)!, which you can write with a loop or recursion. <b>Fibonacci</b>: each number is the sum of the two before it. Simple recursion for Fibonacci is extremely slow because it recalculates the same values again and again, so use a loop with two variables (O(n)) or save results you have already calculated (memoisation).`,

"Check if a number is prime and print all primes up to N":
`To test one number, try dividing it by 2, 3, 4… only up to its square root; if nothing divides it, it is prime. To find all primes up to N, use the <b>Sieve of Eratosthenes</b>: start with all numbers marked prime, then for each prime, cross out all its multiples. Whatever is left unmarked is prime.`,

"Find duplicate characters in a string and count each character's frequency":
`Use a counter for each character: an <code>int[256]</code> array or a <code>HashMap&lt;Character, Integer&gt;</code>. Go through the string once, adding 1 for each character you see. Afterwards, any character with a count greater than 1 is a duplicate. Use a <code>LinkedHashMap</code> if you need to keep the order in which characters first appeared.`,

"Swap two numbers without a third variable, and swap two objects in Java":
`With arithmetic: <code>a = a + b; b = a - b; a = a - b;</code> (which can overflow), or with XOR: <code>a ^= b; b ^= a; a ^= b;</code> (which breaks if both are the same variable). For objects, Java passes copies of references to methods, so a swap method cannot swap the caller's variables; you can only swap things inside an array or object you pass in.`,

"Print the common star patterns — pyramid, Pascal's triangle and a diamond":
`Each is nested loops: one loop per row, inner loops for spaces then symbols. For a pyramid, row i has <code>n - i</code> spaces and <code>2i - 1</code> stars. A diamond is a pyramid followed by an upside-down pyramid. In Pascal's triangle, each number is the sum of the two numbers above it, which can be calculated as you move along the row.`,

"Find the second largest element in an array, and the missing number from 1..n":
`<b>Second largest</b>: go through the array once, keeping track of the largest and second largest so far; when you find a new largest, the old largest becomes second. Ask whether duplicates count. <b>Missing number</b>: the numbers 1 to n add up to n(n+1)/2, so subtract the actual sum of the array from that; the difference is the missing number.`,

"Remove duplicates from an array and from a list, preserving order":
`For an unsorted list where order matters, go through it and add each item to a <code>LinkedHashSet</code>, which ignores repeats and keeps the original order. For a sorted array you can do it in place with two pointers: one reads every element, the other marks where to write the next new, different value.`,

"Sort an array without a built-in sort — write bubble, selection and insertion sort":
`<b>Bubble sort</b> repeatedly swaps neighbouring items that are in the wrong order. <b>Selection sort</b> finds the smallest remaining item and puts it next in line. <b>Insertion sort</b> takes each item and slides it back into its correct place among the already-sorted items, like sorting playing cards in your hand. All are O(n²); insertion sort is fast on nearly sorted data.`,

"Count vowels, consonants, words and characters in a sentence":
`Go through the sentence once. For each character, decide whether it is a letter; if so, check whether it is a vowel or a consonant. Count words by splitting on spaces, but trim the sentence first and split on one or more spaces (<code>\\s+</code>), so double spaces and empty input do not create fake empty words.`,

"Find the largest and smallest number, and the sum of digits, in an integer":
`To look at each digit of a number, repeatedly take <code>n % 10</code> (the last digit) and then do <code>n / 10</code> (remove it). Add each digit to a running total for the sum, and compare each with the current largest and smallest. Start largest and smallest from the first digit, not from 0, and handle negative numbers by working with the absolute value.`
});
