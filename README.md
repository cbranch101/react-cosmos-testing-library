<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [React Cosmos Testing Library](#react-cosmos-testing-library)
  - [Installation](#installation)
  - [Basic Example](#basic-example)
    - [Component](#component)
    - [Cosmos Fixture](#cosmos-fixture)
    - [Test](#test)
  - [renderFactory Options](#renderfactory-options)
  - [New Queries](#new-queries)
  - [Custom Serializers](#custom-serializers)
    - [addCustomSerializers.js](#addcustomserializersjs)
    - [Add the serializer to a test](#add-the-serializer-to-a-test)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# React Cosmos Testing Library

## Installation

```console
yarn add --dev react-cosmos-testing-library
```

`react-cosmos-testing-library` is also required as a peerDependency

## Basic Example

### Component

To demonstrate how to test, we're going to set up a simple component that has
some state handling, some basic content rendered into the dom, and a handler
that needs to be called. When `ToggleButton` is clicked, `Toggled` will appear
above the button, and `onToggle` will be called.

```javascript
class ToggleButton extends React.Component {
  state = {
    isActive: true,
  }
  handleClick = () => {
    const {isActive} = this.state
    const newIsActive = !isActive
    this.props.onToggle(newIsActive)
    this.setState({
      isActive: newIsActive,
    })
  }
  render() {
    const {text} = this.props
    return (
      <div>
        <span data-test-id="text-area">{this.state.isActive && 'Toggled'}</span>
        <button data-test-id="button" onClick={this.handleClick}>
          {text}
        </button>
      </div>
    )
  }
}
```

### Cosmos Fixture

This is a very simple fixture in this case, because there aren't very many props
to ToggleButton. You just need to provide everything the component needs to
render. For more complicated components, you would export multiple fixtures here
to represent the different possible configurations of the component.

```javascript
import ToggleButton from './ToggleButton'

export default {
  component: ToggleButton,
  props: {
    text: 'Hello World',
    onToggle: () => console.log('toggling'),
  },
}
```

### Test

Now that we have the component and the fixture, it's as simple as stepping
through the component and testing it in the same way it would be used in Cosmos.

```javascript
// import the fixture you want to test
import fixture from 'ToggleButton.fixture.js'
import {renderFactory} from 'react-cosmos-testing-library'

const render = renderFactory({
  callbacks: ['onToggle'],
  // add any new test functions that you
  // want to be shared across all tests in all files
  getTestFunctions: ({
    functions: {clickTestId, waitForCallBack, getByTestId},
  }) => {
    const clickButton = () => clickTestId('button')
    const getCurrentText = () => getByTestId('text-area').textContent
    // Because onToggle is is provided to callbacks
    // you can use waitForCallback to wait for a particular number of times onToggle is called
    const waitForOnToggle = desiredCall =>
      waitForCallBack('onToggle', desiredCall)
    return {
      clickButton,
      getCurrentText,
      waitForOnToggle,
    }
  },
})

describe('text is updated on toggle', async () => {
  // call render, pass in the fixture, and get back the queries, which are ready to use
  const {getCurrentText, clickButton, waitForText, waitForOnToggle} = render(
    fixture,
  )
  // ensure the component renders correctly on load
  // this will error if the text isn't found
  await waitForText('Hello World')
  clickButton()
  // confirm the text updates after the clicking the button
  expect(getCurrentText()).toEqual('Toggled')

  // confirm that waitForToggle is called once with the right arguments
  const argsPassedToOnToggle = await waitForOnToggle(1)
  // it was initially false, it should be set to true after toggling
  expect(argsPassedToOnToggle).toEqual(['true'])
})
```

## renderFactory Options

renderFactory lets you customize how you render a cosmos fixture and abstract
out any repeated test functionality that's needed

#### getTestFunctions

Receives any already defined test functions and allows you to add test functions
that are specific to your tests. You only need to return any new functions that
you want to add

```javascript
  getTestFunctions: {
    functions: existingFunctions => ({
        // any new functions you want to add
        ...existingFunctions,
    }),
  }
```

#### getProps

A function that allows you to modify the props provided to the fixture

```javascript
getProps: props => ({
  // any modifications you want to make to props
  ...props,
})
```

#### updateFixture

A function that allows you to modify anything in the fixture

```javascript
updateFixture: fixture => ({
  // any modifications you want to make to the fixture
  ...fixture,
})
```

#### callbacks

An array of strings defining all callback props provided to the component that
you would like to be automatically stubbed out with jest mock functions that can
be used in conjunction with `waitForCallback`

```javascript
callbacks: ['onToggle', 'onClick']
```

## New Queries

In addition to all of the queries provided by `react-testing-library` documented
[here](https://testing-library.com/docs/dom-testing-library/api-queries),
several new queries are provided

#### clickTestId

```javascript
id => fireEvent.click(getByTestId(id))
```

#### clickElement

```javascript
element => fireEvent.click(element)
```

#### makeSureTextIsGone

Immediately throws an error if the provided text is still in the dom

#### makeSureTestIdIsGone

same as `makeSureTextIsGone` for test ids

#### getByTestIdInBase

Useful when testing elements that render directly into body(like portals). All
of the provided queries start at the component that is rendered by cosmos, this
query looks at the root dom node(the equivalent of body inside of cosmos)

#### waitForCallback

Requires that a correspondingly named callback was provided in the `callbacks`
array in the `renderFactory` options. Calling this allows you to wait for
desired number of calls and then resolves with the provided arguments. If the
specified number of calls doesn't occur within 5 seconds, an error is thrown

`const argsPassedToSecondOnToggleCall = await waitForCallBack('onToggle', 2)`

#### waitForTextToBeGone

An async function that waits for the supplied text to not be in the dom, it will
error after 5 seconds if it still exists

#### waitForTestIdToBeGone

Same as `waitForTextToBeGone` but for test ids

#### waitForTextAndClick

Wait for the text to be in the dom, and then click on the element that contains
it

#### waitFor modifiers

The following functions are all just combinations of `waitForElement` and a
given query like `getByTestId` or `getByText`. They will keep searching for the
element for five seconds, and then error if it isn't found

- waitForTestId
- waitForText
- waitForAltText
- waitForPlaceholderText

## Custom Serializers

A central tenet of `react-testing-library` is to, as much as possible, rely on
the built in queries like `getByTestId` and `getByText` when asserting values in
the dom. This makes it much easier to test the code similarly to how it will be
used.

For simple components, this is a great solution. For complicated compound
components however, it can start to get unwieldy. In situations like that,
snapshot testing is a great solution, but even this has many potential
[issues](https://kentcdodds.com/blog/effective-snapshot-testing). This is where
custom serializers come in.

Instead of serializing an entire dom object that could be hundreds or even
thousands of lines long and frequently break when nothing of relevance has
changed, you can use the same standard `react-testing-library` queries to build
up a simple serializable string that is much easier to follow when it breaks.

### addCustomSerializers.js

Create a file that will contain all of your custom serializers for all of your
tests.

```javascript
import {serializerBuilder} from 'react-cosmos-testing-library'

const serializerMap = {
  customTable: {
    // the test id for the object you want to serialze
    testIds: ['comparison-values'],
    print: val => {
      // convert the react testing library dom object
      // into a string that easily serialized
      const rows = queryByAllTestId(val, 'row')
      return rows
        .map(row => {
          // As much as possible, rely on the the standard react-testing-library queries, and avoid manual dom traversal
          const cells = queryAllByTestId(row, 'cell')
          return cells.reduce(
            (rowString, cell) => `:${rowString}:${cell.textContent}`,
            '',
          )
        })
        .join('\n')
    },
  },
}

const addCustomSerialzers = serializerBuilder(serializerMap)

export default addCustomSerialzers
```

### Add the serializer to a test

After defining the serializer, you need to initialize it in the test

```javascript
import addCustomSerializers from './addCustomSerialzers'
// this corresponds to the key defined in the serializer map
// NOTE: this needs to be defined in EVERY test file
// that is going to use that custom serializer
addCustomSerializers(['customTable'])
```
