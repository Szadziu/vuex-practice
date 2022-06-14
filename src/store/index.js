import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        tasks: require('../tasks'),
    },
    getters: {
        getTasksByStatus: (state) => (status) => {
            return state.tasks
                .filter((task) => task.status === status)
                .sort((a, b) => a.priority - b.priority);
        },

        getTasksByStatusAndPriority: (state, getters) => (status, priority) => {
            console.log(priority);
            return getters
                .getTasksByStatus(status)
                .splice(priority.start - 1, priority.end - priority.start + 1);
        },
    },
    //synchroniczne (setter)
    mutations: {
        setTaskStatus(state, payload) {
            const task = state.tasks.slice(0, 1)[0].status;
            console.log(task, payload);
        },

        setTaskPriority(state, { id, priority }) {
            const ix = state.tasks.findIndex((task) => task.id === id);
            if (ix === -1) return;

            const copy = JSON.parse(JSON.stringify(state.tasks[ix]));
            copy.priority = priority;

            state.tasks.splice(ix, 1, copy);
        },
    },
    //moga byc asynchroniczne
    actions: {
        useAction(context, payload) {
            console.log(context, payload);
        },
    },
    modules: {},
});
