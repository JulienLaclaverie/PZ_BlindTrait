--***********************************************************
--**           The Blind Trait Mod - By Onkeen             **
--***********************************************************

require "ISUI/ISUIElement"
require('NPCs/MainCreationMethods');

BlindMouseActions = ISUIElement:derive("BlindMouseActions");
local overlayBlind = getTexture("media/textures/GUI/blind.png");
local fullBlind = getTexture("media/textures/GUI/black.png");

-- Screen Resolution
local screenX;
local screenY;
-- Mouse Bounds vars
local minXvalue;
local maxXvalue;
local minYvalue;
local maxYvalue;
local currentFullBlindOpacity = 0;
local isMouseOutOfBounds = false;

function BlindMouseActions:initialize()

	ISUIElement.initialise(self);
	self:setVisible(false);

end

function BlindMouseActions:isCamLookingAway()

	local mx = getMouseX();
	local my = getMouseY();
	if mx < minXvalue then
		isMouseOutOfBounds = true;
	elseif mx > maxXvalue then
		isMouseOutOfBounds = true;
	elseif my < minYvalue then
		isMouseOutOfBounds = true;
	elseif my > maxYvalue then
		isMouseOutOfBounds = true;
	else
		isMouseOutOfBounds = false;
	end

end

function changeFullBlindOpacity()

	if isMouseOutOfBounds == true then

		if currentFullBlindOpacity < 1 then

			currentFullBlindOpacity = currentFullBlindOpacity + 0.02;

		end

	elseif isMouseOutOfBounds == false then

		if currentFullBlindOpacity > 0 then

			currentFullBlindOpacity = currentFullBlindOpacity - 0.02;

		end

	end

	UIManager.DrawTexture(fullBlind, 0, 0, screenX, screenY, currentFullBlindOpacity);

end


function isBlind()

	player = getPlayer();
	
	if player then
	
		-- if player has blind trait
		if player:HasTrait("Blind") then
			
			if isKeyDown(Keyboard.KEY_LCONTROL) or isMouseButtonDown(1) then
				BlindMouseActions:isCamLookingAway();
			else
				isMouseOutOfBounds = false;
			end
			changeFullBlindOpacity();

			--Get the blind user number
			local playerNum = player:getPlayerNum();

			-- Show the blind overlay
			UIManager.DrawTexture( overlayBlind, 0, 0, screenX, screenY, 1);

			-- Show the blind overlay
			UIManager.DrawTexture( overlayBlind, 0, 0, screenX, screenY, 1);

			--Force constant zoom
			if (getCore():getZoom(0) > 0.5) then
				getCore():doZoomScroll(0, -1);
			end

			--You can also change zoom via this way but it may mess up with the player's settings
			--getCore():setOptionZoom(true);
			--getCore():zoomOptionChanged();
			--getCore():doZoomScroll(0, -4);
			--getCore():setOptionZoom(false);
			--getCore():zoomOptionChanged();

		end

	end
	
	
end

function setScreenSize()
	screenX = getCore():getScreenWidth();
	screenY = getCore():getScreenHeight();
	setMouseBounds();
end

function screenResizer( _ox, _oy, x, y )
	screenX = x;
	screenY = y;
	setMouseBounds();
end

function setMouseBounds()
	-- Inside these bounds, the mouse don't look away
	-- TODO : Recalculate bounds for not 16:9 screens (these are calculated for 1920*1080)
	minXvalue = screenX * 0.26;
	maxXvalue = screenX * 0.74;
	minYvalue = screenY * 0.26;
	maxYvalue = screenY * 0.74;
end

function CharacterCreationProfession:initPlayer()

	-- My code to add "passive" traits (perception and removing the reading ability) for blind characters
	local blindTrait = TraitFactory.getTrait("Blind");

	for i=1,#self.listboxTraitSelected.items do
		if self.listboxTraitSelected.items[i] ~= nil then
			local trait = self.listboxTraitSelected.items[i].item;
			if trait:getLabel() == blindTrait:getLabel() then
				local fromFactoryTrait1 = TraitFactory.getTrait("EagleEyed");
				local fromFactoryTrait2 = TraitFactory.getTrait("NightVision");
				local fromFactoryTrait3 = TraitFactory.getTrait("KeenHearing");
				local fromFactoryTrait4 = TraitFactory.getTrait("Illiterate");
				local newTrait = CharacterCreationProfession.instance.listboxTraitSelected:addItem(fromFactoryTrait1:getLabel(), fromFactoryTrait1);
				local newTrait = CharacterCreationProfession.instance.listboxTraitSelected:addItem(fromFactoryTrait2:getLabel(), fromFactoryTrait2);
				local newTrait = CharacterCreationProfession.instance.listboxTraitSelected:addItem(fromFactoryTrait3:getLabel(), fromFactoryTrait3);
				local newTrait = CharacterCreationProfession.instance.listboxTraitSelected:addItem(fromFactoryTrait4:getLabel(), fromFactoryTrait4);
				newTrait.tooltip = fromFactoryTrait1:getDescription();
				newTrait.tooltip = fromFactoryTrait2:getDescription();
				newTrait.tooltip = fromFactoryTrait3:getDescription();
				newTrait.tooltip = fromFactoryTrait4:getDescription();
			end
		end
	end

	-- The Indie Stone's Code for saving the profession of the player
	MainScreen.instance.desc:setForename(MainScreen.instance.charCreationHeader.forenameEntry:getText());
	MainScreen.instance.desc:setSurname(MainScreen.instance.charCreationHeader.surnameEntry:getText());
	if self.listboxProf.selected > -1 then
		MainScreen.instance.desc:setProfession(self.listboxProf.items[self.listboxProf.selected].item:getType());
    else
        MainScreen.instance.desc:setProfession(self.listboxProf.items[0].item:getType());
    end
end

Events.OnGameBoot.Add( setScreenSize );
Events.OnGameBoot.Add( setMouseBounds );
Events.OnGameBoot.Add( BlindMouseActions );
Events.OnResolutionChange.Add( screenResizer );
Events.OnPreUIDraw.Add( changeFullBlindOpacity );
Events.OnPreUIDraw.Add( isBlind );