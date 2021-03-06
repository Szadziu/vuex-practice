import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        tasks: require('../tasks'),
    },

    getters: {
        getAllMembers: (state) => {
            const set = new Set();

            return state.tasks.flatMap((task) =>
                task.members
                    .map((member) => member)
                    .reduce((finalList, { id, name }) => {
                        const key = `${id}${name}`;
                        if (!set.has(key)) {
                            finalList.push({
                                id,
                                name,
                            });
                        }
                        set.add(key);
                        return finalList;
                    }, [])
            );
        },

        getAllTags: (state) => {
            return new Set(state.tasks.flatMap((task) => task.tags));
        },

        //* POBRANIE TABLICY TASKÓW PRZEFILTROWANEJ WG PRZEKAZANEGO STATUSU ORAZ POSORTOWANEJ WG PRIORYTETU
        getTasksByStatus:
            (state) =>
            (status, { member, tag } = {}) => {
                let filteredTasks = state.tasks
                    .filter((task) => task.status === status)
                    .sort((a, b) => a.priority - b.priority);

                if (member) {
                    filteredTasks = filteredTasks.filter((task) =>
                        task.members.map((member) => member.id).includes(member)
                    );
                }

                if (tag) {
                    filteredTasks = filteredTasks.filter((task) =>
                        task.tags.includes(tag)
                    );
                }

                return filteredTasks;
            },

        //* POBRANIE WYCINKA Z TABLICY PRZEFILTROWANEJ PO STATUSIE Z WYBRANYCH CORDSÓW (START, END)
        getTasksByStatusAndPriority: (state, getters) => (status, priority) => {
            // console.log(priority);
            return getters
                .getTasksByStatus(status)
                .splice(priority.start - 1, priority.end - priority.start + 1);
        },
    },

    mutations: {
        setTaskPriority(state, { taskId, priority }) {
            //* OKREŚLENIE INDEXU O ID ELEMENTU ZGODNEGO Z ID ELEMENTU Z WYCINKA
            const index = state.tasks.findIndex((task) => task.id === taskId);
            if (index === -1) return;

            //* KOPIOWANIE OBIEKTU TASKA ZE ZGODNYM ID
            const copy = JSON.parse(JSON.stringify(state.tasks[index]));

            //* USTAWIENIE DLA NIEGO NOWEGO PRIORYTETU (W TYM PRZYPADKU OBNIŻONEGO O 1) => ELEMENT Z WYCINKA WSKOCZY O JEDEN W GÓRĘ, BO PRZESUWALIŚMY ELEMENT CHWYTANY W DÓŁ.
            copy.priority = priority;

            //* AKTUALIZACJA STANU POPRZEZ WSTAWIENIE W MIEJSCE INDEXU ELEMENTU ZE ZGODNYM ID, KONKRETNY ELEMENT
            state.tasks.splice(index, 1, copy);
        },

        setTaskStatus(state, { taskId, newStatus }) {
            //* to mógłby być getter getTaskById
            const found = state.tasks.find((task) => task.id === taskId);
            found.status = newStatus;
        },
    },

    actions: {},
    modules: {},
});
