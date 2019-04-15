import {
  waitForElement,
  wait,
  within,
  fireEvent,
  waitForDomChange,
  getByTestId as getByTestIdRoot,
} from 'react-testing-library'

import render from './render'

export default ({
  getProps = props => props,
  getTestFunctions = () => ({}),
  callbacks = [],
  updateFixture = fixture => fixture,
}) => (fixture, ...args) => {
  const {props} = fixture
  const configuredCallbacks = callbacks.reduce((memo, callbackName) => {
    memo[callbackName] = jest.fn()
    return memo
  }, {})

  const updatedProps = getProps({
    ...props,
    ...configuredCallbacks,
  })
  const updatedFixture = {
    ...updateFixture(fixture, ...args),
    props: updatedProps,
  }

  const returnedFromRender = render(updatedFixture)
  const {
    getByTestId,
    getByText,
    baseElement,
    getByAltText,
    getByPlaceholderText,
    queryByText,
    queryByTestId,
  } = returnedFromRender
  const waitForTextToBeGone = text => {
    return wait(() => {
      const foundText = queryByText(text)
      if (foundText !== null) {
        throw Error(
          `${text} is still found in the dom, it was supposed to be removed`,
        )
      }
    })
  }

  const getArgumentsPassedIntoCallback = (callbackName, desiredCall) => {
    const index = desiredCall - 1
    const func = configuredCallbacks[callbackName]
    return func.mock.calls[index]
  }

  const waitForCallback = async (callbackName, desiredCall) => {
    let passedIn
    await wait(() => {
      passedIn = getArgumentsPassedIntoCallback(callbackName, desiredCall)
      if (passedIn === undefined) {
        throw Error(`${callbackName} was never called ${desiredCall} times`)
      }
    })
    return passedIn
  }

  const makeSureTestIdIsGone = id => queryByTestId(id) === null
  const makeSureTextIsGone = id => queryByText(id) === null

  const waitForTestIdToBeGone = id => {
    return wait(() => {
      if (!makeSureTestIdIsGone(id)) {
        throw Error(
          `id ${id} is still found in the dom, it was supposed to be removed`,
        )
      }
    })
  }

  const waitForTestId = id => waitForElement(() => getByTestId(id))
  const waitForText = text => waitForElement(() => getByText(text))
  const waitForAltText = text => waitForElement(() => getByAltText(text))
  const waitForPlaceholderText = text =>
    waitForElement(() => getByPlaceholderText(text))
  const waitForTextInHeader = text =>
    waitForElement(() =>
      within(getByTestId('global-nav-picker-button')).getByText(text),
    )
  const getByTestIdInBase = id => getByTestIdRoot(baseElement, id)

  const clickTestId = id => fireEvent.click(getByTestId(id))
  const clickElement = element => fireEvent.click(element)
  const waitForTextAndClick = async text => {
    clickElement(await waitForText(text))
  }

  const newFunctions = {
    waitForTextToBeGone,
    within,
    clickElement,
    waitForTextAndClick,
    waitForDomChange,
    makeSureTestIdIsGone,
    makeSureTextIsGone,
    clickTestId,
    getByTestIdInBase,
    waitForTestIdToBeGone,
    getArgumentsPassedIntoCallback,
    waitForTestId,
    waitForText,
    waitForAltText,
    waitForCallback,
    waitForPlaceholderText,
    waitForTextInHeader,
  }
  const baseFunctions = {
    ...newFunctions,
    ...returnedFromRender,
  }
  const customFunctions = getTestFunctions({
    functions: baseFunctions,
    props: updatedProps,
  })
  return {
    ...baseFunctions,
    ...customFunctions,
  }
}
