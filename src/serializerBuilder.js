const matchesTestId = (object, testId) => {
  return (
    object &&
    typeof object === 'object' &&
    object.querySelectorAll &&
    object.getAttribute('data-testid') === testId
  )
}

export default serializerMap => {
  return serializers => {
    serializers.map(serializerName => {
      const {testIds, print} = serializerMap[serializerName]
      expect.addSnapshotSerializer({
        test: val => {
          if (typeof testIds === 'function') {
            return testIds(val)
          }
          return testIds.some(id => matchesTestId(val, id))
        },
        print,
      })
      return null
    })
  }
}
