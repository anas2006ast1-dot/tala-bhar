
### React Hooks: Avoid Unmemoized Callbacks in Effect Dependencies
When passing callbacks from a parent component to a child component that uses the callback inside a `useEffect` dependency array, **always** wrap the callback in `useCallback` or find an alternative approach (e.g. using a `useEffect` in the component itself to respond to props changes). Passing an unmemoized callback will cause the child's effect to run on every parent render, leading to infinite loops or state resets on every keystroke.
