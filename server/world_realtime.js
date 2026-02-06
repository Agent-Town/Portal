const { Server, Room } = require('colyseus');
const { WebSocketTransport } = require('@colyseus/ws-transport');

const { parseCookies } = require('./util');

const MOVE_SPEED = 20;
const INTERACTION_COOLDOWN_MS = 3000;

class WorldInstanceRoom extends Room {
  onCreate(options) {
    this.instanceId = options.instanceId || 'inst_public_001';
    this.manager = options.manager || WorldInstanceRoom.manager;
    this.manager.ensureInstance(this.instanceId);
    this.manager.recomputeInstance(this.instanceId);
    this.players = new Map();
    this.cooldowns = new Map();
    this.maxClients = this.manager.getPolicy().maxPlayers;

    this.onMessage('move_intent', (client, payload) => this.handleMove(client, payload));
    this.onMessage('interact_intent', (client, payload) => this.handleInteraction(client, payload));
  }

  onAuth(client, options, request) {
    const cookies = parseCookies(request?.headers?.cookie || '');
    const sessionId = cookies.et_session || options?.sessionId || client.sessionId;
    if (!sessionId) return false;
    return {
      sessionId: String(sessionId),
      displayName: typeof options?.displayName === 'string' ? options.displayName.slice(0, 32) : null
    };
  }

  async onJoin(client, options, auth) {
    const sessionId = auth?.sessionId || client.sessionId;
    const playerId = sessionId;
    const pos = this.manager.initialPosition(sessionId, this.instanceId);
    this.players.set(client.sessionId, {
      playerId,
      sessionId,
      displayName: auth?.displayName || options?.displayName || 'visitor',
      x: pos.x,
      y: pos.y,
      seq: 0
    });

    await this.manager.markPresence(this.instanceId, sessionId, true);
    this.broadcastState();
    client.send('room_joined', { ok: true, instanceId: this.instanceId, playerId });
  }

  async onLeave(client) {
    const player = this.players.get(client.sessionId);
    if (player) {
      await this.manager.markPresence(this.instanceId, player.sessionId, false);
    }
    this.players.delete(client.sessionId);
    this.broadcastState();
  }

  handleMove(client, payload) {
    const player = this.players.get(client.sessionId);
    if (!player) return;

    const seq = Number(payload?.seq || 0);
    const dirX = Number(payload?.dirX);
    const dirY = Number(payload?.dirY);
    if (!Number.isFinite(dirX) || !Number.isFinite(dirY)) return;
    if (Math.abs(dirX) > 1 || Math.abs(dirY) > 1) return;
    if (seq <= player.seq) return;

    player.seq = seq;
    const next = this.manager.clampPosition(player.x + dirX * MOVE_SPEED, player.y + dirY * MOVE_SPEED);
    player.x = next.x;
    player.y = next.y;
    this.broadcastState();
  }

  handleInteraction(client, payload) {
    const player = this.players.get(client.sessionId);
    if (!player) return;

    const targetType = typeof payload?.targetType === 'string' ? payload.targetType : '';
    const targetId = typeof payload?.targetId === 'string' ? payload.targetId : '';
    if (targetType !== 'house' || !targetId) {
      client.send('interaction_result', { ok: false, error: 'INVALID_TARGET' });
      return;
    }

    const houses = this.manager.getInstanceHouses(this.instanceId);
    const allowed = houses.some((house) => house.houseId === targetId);
    if (!allowed) {
      client.send('interaction_result', { ok: false, error: 'TARGET_NOT_IN_INSTANCE', targetId });
      return;
    }

    const key = `${player.playerId}:${targetId}`;
    const now = Date.now();
    const cooldownUntil = this.cooldowns.get(key) || 0;
    if (cooldownUntil > now) {
      client.send('interaction_result', {
        ok: false,
        error: 'COOLDOWN',
        targetId,
        retryInMs: cooldownUntil - now
      });
      return;
    }

    this.cooldowns.set(key, now + INTERACTION_COOLDOWN_MS);
    const result = {
      ok: true,
      event: 'house_interaction',
      instanceId: this.instanceId,
      playerId: player.playerId,
      targetType,
      targetId,
      cooldownMs: INTERACTION_COOLDOWN_MS,
      at: new Date(now).toISOString()
    };
    this.broadcast('interaction_result', result);
  }

  broadcastState() {
    const houses = this.manager.getInstanceHouses(this.instanceId).map((house) => ({
      houseId: house.houseId,
      type: house.type,
      name: house.name,
      coord: house.coord
    }));
    const players = Array.from(this.players.values()).map((player) => ({
      playerId: player.playerId,
      displayName: player.displayName,
      x: player.x,
      y: player.y
    }));
    this.broadcast('state_patch', {
      instanceId: this.instanceId,
      players,
      houses,
      tickAt: Date.now()
    });
  }
}

async function startWorldRealtimeServer({ port, manager, server, publicPort }) {
  WorldInstanceRoom.manager = manager;
  const transportOptions = {
    pingInterval: 3000,
    pingMaxRetries: 3
  };
  if (server) transportOptions.server = server;

  const gameServer = new Server({
    transport: new WebSocketTransport(transportOptions)
  });

  gameServer.define('world_instance_v1', WorldInstanceRoom).filterBy(['instanceId']);

  let realtimePort = Number(port || 2570);
  if (!server) {
    await gameServer.listen(realtimePort);
  } else {
    realtimePort = Number(publicPort || realtimePort);
  }

  return {
    gameServer,
    port: realtimePort,
    roomName: 'world_instance_v1'
  };
}

module.exports = {
  startWorldRealtimeServer
};
