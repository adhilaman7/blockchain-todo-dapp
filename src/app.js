App = {
  loading: false,
  contracts: {},

  load: async () => {
    await App.loadWeb3()
    await App.loadAccount()
    await App.loadContract()
    await App.render()
  },

  loadWeb3: async () => {
    if (window.ethereum) {
      App.web3Provider = window.ethereum
      window.web3 = new Web3(window.ethereum)
      try {
        const accounts = await window.ethereum.enable()
        App.account = accounts[0]
      } catch (error) {
        alert("Please approve MetaMask connection")
      }
    } else if (window.web3) {
      App.web3Provider = window.web3.currentProvider
      window.web3 = new Web3(window.web3.currentProvider)
      App.account = web3.eth.accounts[0]
    } else {
      alert("Please install MetaMask!")
    }
  },

  loadAccount: async () => {
    // Account is already set in loadWeb3
    if (!App.account) {
      App.account = web3.eth.accounts[0]
    }
  },

  loadContract: async () => {
    const todoList = await $.getJSON('TodoList.json')

    App.contracts.TodoList = TruffleContract(todoList)
    App.contracts.TodoList.setProvider(App.web3Provider)

    App.todoList = await App.contracts.TodoList.deployed()
  },

  render: async () => {
    if (App.loading) return

    App.setLoading(true)

    $('#account').html(App.account)

    await App.renderTasks()

    App.setLoading(false)
  },

  renderTasks: async () => {
    const taskCount = await App.todoList.taskCount()
    const $taskTemplate = $('.taskTemplate').find('.task-item')

    // Clear lists
    $('#taskList').find('.task-item').remove()
    $('#completedTaskList').find('.task-item').remove()

    let activeCount = 0
    let completedCount = 0

    for (let i = 1; i <= taskCount; i++) {
      const task = await App.todoList.tasks(i)

      const taskId = task[0].toNumber()
      const taskContent = task[1]
      const taskCompleted = task[2]

      const $newTask = $taskTemplate.clone()

      $newTask.find('.content').html(taskContent)

      $newTask.find('input')
        .prop('name', taskId)
        .prop('checked', taskCompleted)
        .on('click', App.toggleCompleted)

      if (taskCompleted) {
        $('#completedTaskList').append($newTask)
        completedCount++
      } else {
        $('#taskList').append($newTask)
        activeCount++
      }

      $newTask.show()
    }

    // Update counters
    $('#activeCount').text(activeCount)
    $('#completedCount').text(completedCount)

    // Show/hide empty states
    $('#emptyActive').toggle(activeCount === 0)
    $('#emptyCompleted').toggle(completedCount === 0)
  },

  createTask: async () => {
    App.setLoading(true)

    const content = $('#newTask').val()

    await App.todoList.createTask(content, { from: App.account })

    window.location.reload()
  },

  toggleCompleted: async (e) => {
    App.setLoading(true)

    const taskId = e.target.name

    await App.todoList.toggleCompleted(taskId, { from: App.account })

    window.location.reload()
  },

  setLoading: (boolean) => {
    App.loading = boolean

    const loader = $('#loader')
    const content = $('#content')

    if (boolean) {
      loader.show()
      content.hide()
    } else {
      loader.hide()
      content.show()
    }
  }
}

$(() => {
  $(window).on('load', () => {
    App.load()
  })
})