import createGenericContext from 'react-cosmos-test/generic'
import {render as baseRender} from 'react-testing-library'

const createTestContext = fixture => {
  const context = createGenericContext({
    fixture,
    renderer: baseRender,
  })
  return context
}

export default fixture => {
  const {mount, getWrapper} = createTestContext(fixture)
  mount()
  return getWrapper()
}
